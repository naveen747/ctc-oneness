import { TEAMS, teamById, type TeamId } from "./teams";
import type { Board, TeamTotals } from "./types";
import { CARS, seatsIn } from "./carpool";

export interface Fact {
  emoji: string;
  title: string;
  text: string;
  team?: TeamId;
}

export interface Recap {
  ranked: { team: TeamId; pts: number; rank: number; wins: number; runners: number }[];
  champions: TeamId[];
  numbers: { label: string; value: number }[];
  facts: Fact[];
}

const names = (ids: TeamId[]) => {
  const n = ids.map((t) => teamById(t).name);
  return n.length <= 1 ? n.join("") : `${n.slice(0, -1).join(", ")} & ${n[n.length - 1]}`;
};

function uniqueLeader(t: TeamTotals): TeamId | null {
  const max = Math.max(...Object.values(t));
  if (max <= 0) return null;
  const top = TEAMS.filter((x) => t[x.id] === max);
  return top.length === 1 ? top[0].id : null;
}

function rankOf(t: TeamTotals, team: TeamId) {
  return 1 + TEAMS.filter((x) => t[x.id] > t[team]).length;
}

export function buildRecap(b: Board): Recap {
  const totals = b.totals ?? { green: 0, red: 0, blue: 0, yellow: 0 };
  const results = [...(b.results ?? [])].reverse(); // oldest first
  const timeline = b.timeline ?? [];
  const members = b.members;

  const runners: TeamTotals = { green: 0, red: 0, blue: 0, yellow: 0 };
  for (const r of results) for (const t of r.runners) runners[t]++;

  const sorted = TEAMS.map((t) => ({ team: t.id, pts: totals[t.id] })).sort((a, b) => b.pts - a.pts);
  const ranked = sorted.map((x) => ({
    ...x,
    rank: 1 + sorted.filter((y) => y.pts > x.pts).length,
    wins: b.wins?.[x.team] ?? 0,
    runners: runners[x.team],
  }));
  const champions = ranked.filter((r) => r.rank === 1 && r.pts > 0).map((r) => r.team);

  const participantCount = members ? Object.values(members).reduce((a, m) => a + m.length, 0) : 0;
  const totalPoints = Object.values(totals).reduce((a, b) => a + b, 0);
  const riders = CARS.reduce((a, c) => a + seatsIn(c), 0);

  const numbers = [
    { label: "Participants", value: participantCount },
    { label: "Games played", value: results.length },
    { label: "Points won", value: totalPoints },
    { label: "Cars pooled", value: CARS.length },
  ].filter((n) => n.value > 0);

  const facts: Fact[] = [];
  if (!results.length) return { ranked, champions, numbers, facts };

  // Champions & margin
  const second = ranked.find((r) => r.rank > 1);
  if (champions.length === 1 && second) {
    const margin = totals[champions[0]] - second.pts;
    facts.push({
      emoji: "🏆",
      title: margin <= 5 ? "A photo finish!" : "Champions of Oneness",
      text: `${teamById(champions[0]).name} finished on top with ${totals[champions[0]]} points, ${margin} ahead of ${teamById(second.team).name}.`,
      team: champions[0],
    });
  } else if (champions.length > 1) {
    facts.push({ emoji: "🤝", title: "Shared crown", text: `${names(champions)} finished level at ${totals[champions[0]]} points. True oneness!` });
  }

  // First blood
  const first = results[0];
  facts.push({
    emoji: "🚀",
    title: "First off the mark",
    text: `${names(first.winners)} won the very first game, ${first.name}.`,
    team: first.winners[0],
  });

  // Lead changes
  let changes = 0;
  let prevLeader: TeamId | null = null;
  const leaders = new Set<TeamId>();
  for (const p of timeline.slice(1)) {
    const l = uniqueLeader(p.totals);
    if (!l) continue;
    leaders.add(l);
    if (prevLeader && l !== prevLeader) changes++;
    prevLeader = l;
  }
  if (changes > 0)
    facts.push({
      emoji: "🔄",
      title: `${changes} lead change${changes > 1 ? "s" : ""}`,
      text: `${leaders.size} different teams held the top spot during the day. Nobody could relax!`,
    });
  else if (prevLeader)
    facts.push({ emoji: "🛡️", title: "Never let go", text: `${teamById(prevLeader).name} held the lead outright from start to finish.`, team: prevLeader });

  // Biggest lead
  let big = { gap: 0, team: null as TeamId | null, game: "" };
  for (const p of timeline.slice(1)) {
    const v = TEAMS.map((t) => p.totals[t.id]).sort((a, c) => c - a);
    const l = uniqueLeader(p.totals);
    if (l && v[0] - v[1] > big.gap) big = { gap: v[0] - v[1], team: l, game: p.name };
  }
  if (big.team && big.gap >= 10)
    facts.push({ emoji: "📈", title: `Biggest lead: ${big.gap} points`, text: `${teamById(big.team).name} pulled clear after ${big.game}.`, team: big.team });

  // Longest win streak
  let best = { team: null as TeamId | null, len: 0 };
  for (const t of TEAMS) {
    let run = 0;
    for (const r of results) {
      run = r.winners.includes(t.id) ? run + 1 : 0;
      if (run > best.len) best = { team: t.id, len: run };
    }
  }
  if (best.team && best.len >= 2)
    facts.push({ emoji: "🔥", title: `${best.len} wins in a row`, text: `${teamById(best.team).name} went on the longest winning streak of the day.`, team: best.team });

  // Comeback
  if (champions.length === 1 && timeline.length > 3) {
    const worst = Math.max(...timeline.slice(1, -1).map((p) => rankOf(p.totals, champions[0])));
    if (worst >= 3)
      facts.push({
        emoji: "💪",
        title: "The comeback",
        text: `${teamById(champions[0]).name} were down in ${worst === 4 ? "last" : "3rd"} place at one point, and still won it all.`,
        team: champions[0],
      });
  }

  // Ties
  const ties = results.filter((r) => r.winners.length > 1).length;
  if (ties) facts.push({ emoji: "⚖️", title: `${ties} tied game${ties > 1 ? "s" : ""}`, text: "Some games were too close to call, so both teams took the full 10 points." });

  // Silver specialists
  const maxRun = Math.max(...Object.values(runners));
  const silver = TEAMS.filter((t) => runners[t.id] === maxRun).map((t) => t.id);
  if (maxRun >= 2 && silver.length === 1)
    facts.push({ emoji: "🥈", title: "Always in the hunt", text: `${teamById(silver[0]).name} were runners-up ${maxRun} times, never far behind.`, team: silver[0] });

  // Every team won something
  const winless = TEAMS.filter((t) => (b.wins?.[t.id] ?? 0) === 0);
  if (!winless.length) facts.push({ emoji: "🌈", title: "Everyone tasted victory", text: "All four teams won at least one game. That's oneness!" });

  // Crowd favourite vs champion
  const cheerMax = Math.max(...Object.values(b.cheers));
  const favs = TEAMS.filter((t) => b.cheers[t.id] === cheerMax && cheerMax > 0).map((t) => t.id);
  if (favs.length === 1) {
    const fav = favs[0];
    facts.push({
      emoji: "📣",
      title: "Crowd favourite",
      text: champions.includes(fav)
        ? `${teamById(fav).name} got the most cheers before the day (${cheerMax}), and then delivered!`
        : `${teamById(fav).name} got the most cheers before the day (${cheerMax}). The games had other plans!`,
      team: fav,
    });
  }

  // Biggest category
  if (members) {
    const counts = new Map<string, number>();
    for (const m of Object.values(members).flat()) if (m.category) counts.set(m.category, (counts.get(m.category) ?? 0) + 1);
    const top = [...counts.entries()].sort((a, c) => c[1] - a[1])[0];
    if (top) facts.push({ emoji: "👨‍👩‍👧‍👦", title: `${top[1]} ${top[0].toLowerCase()}`, text: `${top[0]} were the biggest group taking part this year.` });
  }

  // Carpool
  facts.push({ emoji: "🚗", title: `${riders} people carpooled`, text: `${CARS.length} car owners opened their doors so everyone could reach Khedda together.` });

  return { ranked, champions, numbers, facts };
}
