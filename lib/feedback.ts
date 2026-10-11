import type { FeedbackRow, MoreEvents } from "./db";

export interface GameOption {
  id: number;
  name: string;
}

export interface GameTrend extends GameOption {
  score: number; // 1st = 4 pts, 2nd = 3, 3rd = 2, 4th = 1
  firsts: number; // times picked as #1
  votes: number; // times picked in anyone's top 4
}

export interface PublicFeedbackSummary {
  count: number;
  joy: number | null; // average overall enjoyment, 1-10
  joyDist: number[]; // index 0 = score 1 ... index 9 = score 10
  moreEvents: Record<MoreEvents, number>;
  games: GameTrend[];
}

export interface RatingStat {
  avg: number | null;
  count: number;
  dist: number[]; // index 0 = 1 star ... index 4 = 5 stars
}

export interface AdminFeedbackSummary extends PublicFeedbackSummary {
  food: RatingStat;
  resort: RatingStat;
  fees: RatingStat;
  carpool: RatingStat & { notUsed: number };
  comments: string[]; // newest first, no timestamps (keeps it anonymous)
}

export const RANK_POINTS = [4, 3, 2, 1];

/**
 * Games left out of the "top 4" feedback list: repeat rounds (Batch 2 / Group 2)
 * and the combined "Segregation game 2nd & ladies paper game" round.
 * They still count on the scoreboard.
 */
export function isFeedbackGame(name: string): boolean {
  const n = name.toLowerCase().replace(/\s+/g, " ");
  if (/\b(batch|group|grp)\s*-?\s*(2|ii|two)\b/.test(n)) return false;
  if (/segregation/.test(n) && /(2nd|second|ladies|paper)/.test(n)) return false;
  return true;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

function rating(values: number[], buckets = 5): RatingStat {
  const dist = Array(buckets).fill(0);
  for (const v of values) if (v >= 1 && v <= buckets) dist[v - 1]++;
  const count = values.length;
  return { avg: count ? round1(values.reduce((a, b) => a + b, 0) / count) : null, count, dist };
}

export function summarize(rows: FeedbackRow[], options: GameOption[]): AdminFeedbackSummary {
  const games = new Map<number, GameTrend>(options.map((g) => [g.id, { ...g, score: 0, firsts: 0, votes: 0 }]));
  const moreEvents: Record<MoreEvents, number> = { yes: 0, maybe: 0, no: 0 };
  for (const r of rows) {
    moreEvents[r.more_events] = (moreEvents[r.more_events] ?? 0) + 1;
    (r.top_games ?? []).slice(0, 4).forEach((id, i) => {
      const g = games.get(Number(id));
      if (!g) return;
      g.score += RANK_POINTS[i];
      g.votes += 1;
      if (i === 0) g.firsts += 1;
    });
  }
  const overall = rating(rows.map((r) => r.overall), 10);
  const carpoolUsed = rows.filter((r) => r.carpool > 0).map((r) => r.carpool);
  return {
    count: rows.length,
    joy: overall.avg,
    joyDist: overall.dist,
    moreEvents,
    games: [...games.values()].sort((a, b) => b.score - a.score || b.firsts - a.firsts || a.id - b.id),
    food: rating(rows.map((r) => r.food)),
    resort: rating(rows.map((r) => r.resort)),
    fees: rating(rows.map((r) => r.fees)),
    carpool: { ...rating(carpoolUsed), notUsed: rows.length - carpoolUsed.length },
    comments: rows.map((r) => r.comment?.trim()).filter((c): c is string => !!c),
  };
}

export function toPublic(s: AdminFeedbackSummary): PublicFeedbackSummary {
  return { count: s.count, joy: s.joy, joyDist: s.joyDist, moreEvents: s.moreEvents, games: s.games };
}
