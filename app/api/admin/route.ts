import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { db, UserError, type LeaderboardMode } from "@/lib/db";
import { buildBoard, buildResults, isOpen } from "@/lib/board";
import { isTeamId, type TeamId, WIN_POINTS, RUNNER_POINTS } from "@/lib/teams";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };
const bad = (msg: string, status = 400) => NextResponse.json({ error: msg }, { status, headers: noStore });

const cleanName = (v: unknown) =>
  typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, 80) : "";
const cleanCategory = (v: unknown) => {
  const c = typeof v === "string" ? v.trim().slice(0, 30) : "";
  return c || null;
};
const toId = (v: unknown) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
};

async function state() {
  const snap = await db().snapshot({ includeVoided: true });
  const active = { ...snap, entries: snap.entries.filter((e) => !e.voided) };
  const board = buildBoard({ ...active, settings: { ...snap.settings, leaderboard_mode: "open" } });
  return {
    settings: snap.settings,
    publicOpen: isOpen(snap.settings),
    participants: snap.participants,
    games: snap.games,
    results: buildResults(active).reverse(),
    totals: board.totals,
    cheers: snap.cheers,
    voidedCount: snap.entries.filter((e) => e.voided).length,
  };
}

export async function GET() {
  if (!(await isAdmin())) return bad("Not logged in", 401);
  try {
    return NextResponse.json(await state(), { headers: noStore });
  } catch (err) {
    console.error(err);
    return bad("Could not load data. Check the database connection.", 500);
  }
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return bad("Not logged in", 401);
  const body = await req.json().catch(() => null);
  if (!body || typeof body.action !== "string") return bad("Bad request");
  const store = db();

  try {
    switch (body.action) {
      case "addParticipants": {
        const team = body.team;
        if (!isTeamId(team)) return bad("Pick a team");
        const category = cleanCategory(body.category);
        const names: string[] = (Array.isArray(body.names) ? body.names : [])
          .map(cleanName)
          .filter(Boolean);
        if (!names.length) return bad("Add at least one name");
        if (names.length > 200) return bad("Too many names at once (max 200)");
        await store.addParticipants(names.map((name) => ({ name, team, category })));
        break;
      }
      case "updateParticipant": {
        const id = toId(body.id);
        if (!id) return bad("Bad id");
        const patch: { name?: string; team?: TeamId; category?: string | null } = {};
        if (body.name !== undefined) {
          const n = cleanName(body.name);
          if (!n) return bad("Name can't be empty");
          patch.name = n;
        }
        if (body.team !== undefined) {
          if (!isTeamId(body.team)) return bad("Unknown team");
          patch.team = body.team;
        }
        if (body.category !== undefined) patch.category = cleanCategory(body.category);
        await store.updateParticipant(id, patch);
        break;
      }
      case "deleteParticipant": {
        const id = toId(body.id);
        if (!id) return bad("Bad id");
        await store.deleteParticipant(id);
        break;
      }
      case "deleteAllParticipants": {
        if (body.confirm !== "DELETE") return bad('Type DELETE to confirm');
        await store.deleteAllParticipants();
        break;
      }
      case "addGames": {
        const names: string[] = (Array.isArray(body.names) ? body.names : []).map(cleanName).filter(Boolean);
        if (!names.length) return bad("Add at least one game name");
        if (names.length > 50) return bad("Too many games at once");
        await store.addGames(names);
        break;
      }
      case "renameGame": {
        const id = toId(body.id);
        const name = cleanName(body.name);
        if (!id || !name) return bad("Enter a game name");
        await store.updateGame(id, { name });
        break;
      }
      case "moveGame": {
        const id = toId(body.id);
        const dir = body.dir === "up" ? -1 : 1;
        const snap = await store.snapshot();
        const list = snap.games;
        const i = list.findIndex((g) => g.id === id);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= list.length) break;
        const reordered = [...list];
        [reordered[i], reordered[j]] = [reordered[j], reordered[i]];
        await Promise.all(
          reordered.map((g, idx) => (g.sort_order !== idx + 1 ? store.updateGame(g.id, { sort_order: idx + 1 }) : null))
        );
        break;
      }
      case "deleteGame": {
        const id = toId(body.id);
        if (!id) return bad("Bad id");
        await store.deleteGame(id);
        break;
      }
      case "scoreGame": {
        const gameId = toId(body.gameId);
        if (!gameId) return bad("Pick a game");
        const winners: TeamId[] = Array.isArray(body.winners) ? body.winners.filter(isTeamId) : [];
        const runners: TeamId[] = Array.isArray(body.runners) ? body.runners.filter(isTeamId) : [];
        const uniqW = [...new Set(winners)];
        const uniqR = [...new Set(runners)];
        if (!uniqW.length) return bad("Pick at least one winning team");
        if (uniqW.some((t) => uniqR.includes(t))) return bad("A team can't be both winner and runner-up");
        if (uniqW.length + uniqR.length > 4) return bad("Too many teams");
        const snap = await store.snapshot();
        if (!snap.games.some((g) => g.id === gameId)) return bad("That game no longer exists");
        await store.scoreGame(gameId, [
          ...uniqW.map((team) => ({ team, points: WIN_POINTS })),
          ...uniqR.map((team) => ({ team, points: RUNNER_POINTS })),
        ]);
        break;
      }
      case "voidGame": {
        const gameId = toId(body.gameId);
        if (!gameId) return bad("Bad game");
        await store.voidGame(gameId);
        break;
      }
      case "voidAll": {
        if (body.confirm !== "RESET") return bad("Type RESET to confirm");
        await store.voidAll();
        break;
      }
      case "settings": {
        const patch: { announcement?: string; leaderboard_mode?: LeaderboardMode } = {};
        if (typeof body.announcement === "string") patch.announcement = body.announcement.trim().slice(0, 200);
        if (["auto", "open", "closed"].includes(body.leaderboard_mode)) patch.leaderboard_mode = body.leaderboard_mode;
        await store.updateSettings(patch);
        break;
      }
      default:
        return bad("Unknown action");
    }
    return NextResponse.json(await state(), { headers: noStore });
  } catch (err) {
    if (err instanceof UserError) return bad(err.message, 409);
    console.error(err);
    return bad("Something went wrong saving that. Please try again.", 500);
  }
}
