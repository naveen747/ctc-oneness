import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isTeamId } from "@/lib/teams";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const team = body?.team;
    const prev = isTeamId(body?.prev) ? body.prev : null;
    if (!isTeamId(team)) return NextResponse.json({ error: "Unknown team" }, { status: 400 });
    if (team === prev) return NextResponse.json({ ok: true });
    await db().cheer(team, prev);
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("cheer error", err);
    return NextResponse.json({ error: "Could not save cheer" }, { status: 500 });
  }
}
