"use client";
import { useEffect, useRef, useState } from "react";
import { TEAMS, teamById, type TeamId } from "@/lib/teams";
import type { ResultItem, TeamTotals, TimelinePoint } from "@/lib/types";
import Icon from "./Icon";

export function useCountUp(value: number, ms = 1100) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = from.current;
    if (start === value) return;
    let raf = 0;
    const t0 = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(start + (value - start) * eased));
      if (p < 1) raf = requestAnimationFrame(step);
      else from.current = value;
    };
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      from.current = value;
    };
  }, [value, ms]);
  return shown;
}

export function ranked(totals: TeamTotals) {
  const list = TEAMS.map((t) => ({ team: t, pts: totals[t.id] ?? 0 })).sort((a, b) => b.pts - a.pts);
  let rank = 0;
  let last = -1;
  return list.map((x, i) => {
    if (x.pts !== last) {
      rank = i + 1;
      last = x.pts;
    }
    return { ...x, rank };
  });
}

function Pts({ value }: { value: number }) {
  return <>{useCountUp(value)}</>;
}

export function Leaderboard({ totals, wins, gains }: { totals: TeamTotals; wins?: TeamTotals; gains: { team: TeamId; pts: number; key: number }[] }) {
  const rows = ranked(totals);
  const top = rows[0];
  const max = Math.max(10, top.pts);
  const leaders = rows.filter((r) => r.rank === 1);
  const started = top.pts > 0;
  const lead = leaders.length === 1 ? leaders[0] : null;
  const second = rows.find((r) => r.rank > 1);

  return (
    <div>
      {started && lead ? (
        <div className={`leader-card ${lead.team.id}`} style={{ background: lead.team.gradient }}>
          <div className="glow" />
          <span className="crown"><Icon name="crown" /> Leading now</span>
          <div className="lc-name">{lead.team.name}</div>
          <div className="lc-pts"><b><Pts value={lead.pts} /></b><span>points</span></div>
          <div className="lc-foot">
            {second ? `${lead.pts - second.pts} points ahead of ${second.team.name}` : "Out in front!"}
          </div>
        </div>
      ) : started ? (
        <div className="leader-card" style={{ background: "linear-gradient(135deg,#24365f,#13213f)" }}>
          <div className="glow" />
          <span className="crown"><Icon name="crown" /> It's a tie at the top</span>
          <div className="lc-name">{leaders.map((l) => l.team.short).join(" & ")}</div>
          <div className="lc-pts"><b><Pts value={top.pts} /></b><span>points each</span></div>
          <div className="lc-foot">Next game decides it!</div>
        </div>
      ) : (
        <div className="leader-card" style={{ background: "linear-gradient(135deg,#8e1b24,#13213f)" }}>
          <div className="glow" />
          <span className="crown"><Icon name="sparkle" /> We're live</span>
          <div className="lc-name">Let the games begin!</div>
          <div className="lc-foot">Points appear here the moment each game is scored.</div>
        </div>
      )}

      <div className="lb-list" style={{ marginTop: 12 }}>
        {rows.map((r) => {
          const g = gains.filter((x) => x.team === r.team.id);
          return (
            <div key={r.team.id} className={`lb-row${g.length ? " bump" : ""}`} data-k={g.map((x) => x.key).join("-")}>
              <div className={`lb-rank r${r.rank}`}>{r.rank}</div>
              <div style={{ minWidth: 0 }}>
                <div className="lb-name">
                  <span className="dot" style={{ background: r.team.color, width: 12, height: 12 }} />
                  <span>{r.team.name}</span>
                </div>
                <div className="lb-sub">{wins ? `${wins[r.team.id]} ${wins[r.team.id] === 1 ? "win" : "wins"}` : r.team.short}</div>
              </div>
              <div className="lb-pts" style={{ color: r.team.deep }}>
                <Pts value={r.pts} />
                <small>PTS</small>
              </div>
              <div className="lb-bar"><i style={{ width: `${(r.pts / max) * 100}%`, background: r.team.gradient }} /></div>
              {g.map((x) => (
                <span key={x.key} className="plus-float" style={{ color: r.team.color }}>+{x.pts}</span>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Cumulative points after each game, one line per team. */
export function RaceChart({ timeline }: { timeline: TimelinePoint[] }) {
  if (timeline.length < 2)
    return (
      <div className="card empty">
        <div className="big">📈</div>
        <b>The race chart starts after the first game.</b>
      </div>
    );
  const W = 340, H = 210, L = 30, R = 34, T = 14, B = 26;
  const n = timeline.length - 1;
  const maxV = Math.max(10, ...timeline.flatMap((p) => Object.values(p.totals)));
  const step = maxV <= 30 ? 10 : maxV <= 80 ? 20 : maxV <= 160 ? 40 : 50;
  const top = Math.ceil(maxV / step) * step;
  const x = (i: number) => L + (i / n) * (W - L - R);
  const y = (v: number) => T + (1 - v / top) * (H - T - B);
  const nudge: Record<TeamId, number> = { green: -1.5, red: -0.5, blue: 0.5, yellow: 1.5 };
  const labelEvery = Math.ceil(n / 7);

  const final = timeline[n].totals;
  // spread end labels so they don't overlap
  const ends = TEAMS.map((t) => ({ t, y: y(final[t.id]) })).sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 12) ends[i].y = ends[i - 1].y + 12;

  return (
    <div className="card chart-card chart">
      <div className="chart-legend">
        {TEAMS.map((t) => (
          <span key={t.id}><i className="dot" style={{ background: t.color }} />{t.name}</span>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Points after each game">
        {Array.from({ length: top / step + 1 }, (_, k) => k * step).map((v) => (
          <g key={v}>
            <line className="grid" x1={L} x2={W - R} y1={y(v)} y2={y(v)} />
            <text className="axis" x={L - 6} y={y(v) + 3} textAnchor="end">{v}</text>
          </g>
        ))}
        {timeline.map((p, i) =>
          i % labelEvery === 0 || i === n ? (
            <text key={i} className="axis" x={x(i)} y={H - 8} textAnchor="middle">{i === 0 ? "0" : p.label}</text>
          ) : null
        )}
        {TEAMS.map((t) => {
          const pts = timeline.map((p, i) => [x(i), y(p.totals[t.id]) + nudge[t.id]] as const);
          const d = pts.map(([a, b], i) => `${i ? "L" : "M"}${a.toFixed(1)},${b.toFixed(1)}`).join(" ");
          let len = 0;
          for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
          const [ex, ey] = pts[pts.length - 1];
          return (
            <g key={`${t.id}-${n}`}>
              <path className="line" d={d} stroke={t.color} style={{ ["--len" as string]: Math.ceil(len) + 2 }} />
              <circle cx={ex} cy={ey} r={4.5} fill={t.color} stroke="#fff" strokeWidth={2} />
            </g>
          );
        })}
        {ends.map(({ t, y: ly }) => (
          <text key={t.id} className="end-label" x={W - R + 8} y={ly + 4} fill={t.deep}>{final[t.id]}</text>
        ))}
      </svg>
    </div>
  );
}

export function Stats({ totals, wins, games }: { totals: TeamTotals; wins: TeamTotals; games: number }) {
  const sum = Object.values(totals).reduce((a, b) => a + b, 0);
  const topWins = Math.max(...Object.values(wins));
  const mostWins = TEAMS.filter((t) => wins[t.id] === topWins && topWins > 0);
  return (
    <div className="stats">
      <div className="stat"><b>{games}</b><span>Games</span></div>
      <div className="stat"><b>{sum}</b><span>Points</span></div>
      <div className="stat"><b>{topWins}</b><span>Top wins</span></div>
      <div className="stat" title={mostWins.map((t) => t.name).join(", ")}>
        <b style={{ display: "flex", gap: 3, justifyContent: "center", height: 24, alignItems: "center" }}>
          {mostWins.length ? mostWins.map((t) => <i key={t.id} className="dot" style={{ background: t.color, width: 14, height: 14 }} />) : "–"}
        </b>
        <span>Most wins</span>
      </div>
    </div>
  );
}

const timeFmt = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

function TeamPill({ id, pts, win }: { id: TeamId; pts: number; win: boolean }) {
  const t = teamById(id);
  return (
    <span className="tpill" style={{ background: t.soft, color: t.deep }}>
      <Icon name={win ? "trophy" : "medal"} />
      {t.name}
      <span className="pts">+{pts}</span>
    </span>
  );
}

export function ResultsFeed({ results, limit }: { results: ResultItem[]; limit?: number }) {
  if (!results.length)
    return (
      <div className="card empty">
        <div className="big">🏁</div>
        <b>No games scored yet.</b>
        <div className="muted">Results show up here as soon as each game ends.</div>
      </div>
    );
  const list = limit ? results.slice(0, limit) : results;
  return (
    <div className="feed">
      {list.map((r, i) => (
        <div key={r.gameId} className="card res">
          <div className="res-top">
            <b>
              {r.name}
              {i === 0 && <span className="chip" style={{ marginLeft: 8, padding: "2px 8px", fontSize: 10 }}>LATEST</span>}
            </b>
            <time>{timeFmt(r.at)}</time>
          </div>
          <div className="res-teams">
            {r.winners.map((t) => <TeamPill key={t} id={t} pts={10} win />)}
            {r.runners.map((t) => <TeamPill key={t} id={t} pts={5} win={false} />)}
          </div>
        </div>
      ))}
    </div>
  );
}
