import { NextResponse } from "next/server";
import { db, type FeedbackInput, type MoreEvents } from "@/lib/db";
import { buildResults } from "@/lib/board";
import { isFeedbackGame, summarize, toPublic, type GameOption } from "@/lib/feedback";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

async function playedGames(): Promise<{ options: GameOption[]; open: boolean }> {
  const snap = await db().snapshot();
  const played = buildResults(snap).map((r) => ({ id: r.gameId, name: r.name })).filter((g) => isFeedbackGame(g.name));
  return { options: played, open: snap.settings.feedback_open };
}

// Public: game options + live aggregate (no comments, no per-person rows). CDN-cached for 5s.
export async function GET() {
  try {
    const [{ options, open }, rows] = await Promise.all([playedGames(), db().listFeedback()]);
    return NextResponse.json(
      { open, options, summary: toPublic(summarize(rows, options)) },
      {
        headers: {
          "Cache-Control": "public, max-age=0, must-revalidate",
          "CDN-Cache-Control": "public, s-maxage=5, stale-while-revalidate=60",
          "Vercel-CDN-Cache-Control": "public, s-maxage=5, stale-while-revalidate=60",
        },
      }
    );
  } catch (err) {
    console.error("feedback GET error", err);
    return NextResponse.json({ error: "Feedback is not available right now" }, { status: 503, headers: noStore });
  }
}

// Soft per-instance throttle. Nothing about the sender is stored anywhere.
const recent = new Map<string, number[]>();
function throttled(req: Request): boolean {
  const key = (req.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
  const now = Date.now();
  const list = (recent.get(key) ?? []).filter((t) => now - t < 10 * 60_000);
  if (list.length >= 6) return true;
  list.push(now);
  recent.set(key, list);
  if (recent.size > 5000) recent.clear();
  return false;
}

const int = (v: unknown, min: number, max: number): number | null => {
  const n = Number(v);
  return Number.isInteger(n) && n >= min && n <= max ? n : null;
};

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Bad request" }, { status: 400 });
  if (typeof body.website === "string" && body.website) return NextResponse.json({ ok: true }); // bot honeypot
  if (throttled(req)) return NextResponse.json({ error: "Too many submissions. Please try again later." }, { status: 429 });

  try {
    const { options, open } = await playedGames();
    if (!open) return NextResponse.json({ error: "Feedback is closed now. Thank you!" }, { status: 403 });

    const food = int(body.food, 1, 5);
    const resort = int(body.resort, 1, 5);
    const fees = int(body.fees, 1, 5);
    const carpool = int(body.carpool, 0, 5);
    const overall = int(body.overall, 1, 10);
    const more = ["yes", "maybe", "no"].includes(body.more_events) ? (body.more_events as MoreEvents) : null;
    if (food === null || resort === null || fees === null || carpool === null || overall === null || !more)
      return NextResponse.json({ error: "Please answer all the questions" }, { status: 400 });

    const valid = new Set(options.map((g) => g.id));
    const top = (Array.isArray(body.top_games) ? body.top_games : []).map(Number).filter((id: number) => valid.has(id));
    const topGames: number[] = [...new Set<number>(top)].slice(0, 4);
    if (options.length && !topGames.length)
      return NextResponse.json({ error: "Please pick at least one favourite game" }, { status: 400 });

    const raw = typeof body.comment === "string" ? body.comment : "";
    const comment = raw.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, 1000) || null;

    const f: FeedbackInput = { food, resort, fees, carpool, overall, more_events: more, top_games: topGames, comment };
    await db().addFeedback(f);
    return NextResponse.json({ ok: true }, { headers: noStore });
  } catch (err) {
    console.error("feedback POST error", err);
    return NextResponse.json({ error: "Couldn't save your feedback. Please try again." }, { status: 500, headers: noStore });
  }
}
