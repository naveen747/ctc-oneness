import "server-only";
import { EVENT } from "./content";
import type { Snapshot, Settings } from "./db";
import { TEAM_IDS, type TeamId } from "./teams";
import type { Board, ResultItem, TeamTotals, TimelinePoint, PublicMember } from "./types";

export const zero = (): TeamTotals => ({ green: 0, red: 0, blue: 0, yellow: 0 });

export function isOpen(settings: Pick<Settings, "leaderboard_mode">, now = Date.now()): boolean {
  if (settings.leaderboard_mode === "open") return true;
  if (settings.leaderboard_mode === "closed") return false;
  return now >= Date.parse(EVENT.startISO);
}

/** Group active entries into one result per game, oldest first. */
export function buildResults(s: Pick<Snapshot, "games" | "entries">): ResultItem[] {
  const byGame = new Map<number, ResultItem>();
  for (const e of s.entries) {
    if (e.voided) continue;
    let r = byGame.get(e.game_id);
    if (!r) {
      const game = s.games.find((g) => g.id === e.game_id);
      r = { gameId: e.game_id, name: game?.name ?? "Game", at: e.created_at, winners: [], runners: [] };
      byGame.set(e.game_id, r);
    }
    if (e.created_at < r.at) r.at = e.created_at;
    if (e.points >= 10) r.winners.push(e.team);
    else r.runners.push(e.team);
  }
  return [...byGame.values()].sort((a, b) => a.at.localeCompare(b.at));
}

export function buildBoard(s: Snapshot): Board {
  const now = Date.now();
  const open = isOpen(s.settings, now);
  const base: Board = {
    serverNow: new Date(now).toISOString(),
    start: EVENT.startISO,
    open,
    announcement: s.settings.announcement,
    cheers: s.cheers,
  };
  if (!open) return base;

  const results = buildResults(s);
  const totals = zero();
  const wins = zero();
  const timeline: TimelinePoint[] = [{ label: "Start", name: "Start", totals: zero() }];
  results.forEach((r, i) => {
    for (const t of r.winners) {
      totals[t] += 10;
      wins[t] += 1;
    }
    for (const t of r.runners) totals[t] += 5;
    timeline.push({ label: `G${i + 1}`, name: r.name, totals: { ...totals } });
  });

  const members = Object.fromEntries(TEAM_IDS.map((t) => [t, [] as PublicMember[]])) as Record<TeamId, PublicMember[]>;
  for (const p of s.participants) members[p.team]?.push({ name: p.name, category: p.category });

  return { ...base, totals, wins, results: [...results].reverse(), timeline, members };
}
