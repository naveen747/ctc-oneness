"use client";
import { useEffect, useState } from "react";
import { EVENT } from "@/lib/content";
import { TEAMS, type TeamId } from "@/lib/teams";
import type { TeamTotals } from "@/lib/types";
import Icon from "./Icon";

export function Hero({ compact = false }: { compact?: boolean }) {
  return (
    <header className="hero" style={compact ? { paddingTop: 6 } : undefined}>
      <div className="church">
        {EVENT.church}
        <small>{EVENT.short}</small>
      </div>
      <h1 className="wordmark" style={compact ? { fontSize: "clamp(44px,14vw,64px)" } : undefined}>
        {EVENT.title}
      </h1>
      <p className="tagline">
        <span className="t1">{EVENT.tagline[0]}</span> · <span className="t2">{EVENT.tagline[1]}</span>
        <span className="t3">{EVENT.tagline[2]}</span>
      </p>
      {!compact && <div className="retreat-pill">⛰️ {EVENT.subtitle.toUpperCase()}</div>}
    </header>
  );
}

export function EventInfo() {
  return (
    <div className="section">
      <div className="info-grid">
        <div className="info-tile">
          <div className="ic"><Icon name="calendar" /></div>
          <b>Sat, 10 Oct</b>
          <span>8:00 AM sharp</span>
        </div>
        <div className="info-tile">
          <div className="ic"><Icon name="pin" /></div>
          <b>{EVENT.venue}</b>
          <span>{EVENT.venueArea}</span>
        </div>
        <div className="info-tile">
          <div className="ic"><Icon name="food" /></div>
          <b>Food provided</b>
          <span>{EVENT.provided.join(" · ")}</span>
        </div>
        <div className="info-tile">
          <div className="ic"><Icon name="team" /></div>
          <b>4 teams</b>
          <span>Picked by lottery on the day</span>
        </div>
      </div>
      <a className="btn btn-navy btn-block" style={{ marginTop: 12 }} href={EVENT.mapsUrl} target="_blank" rel="noopener noreferrer">
        <Icon name="pin" /> Open location in Maps
      </a>
    </div>
  );
}

const CHEER_KEY = "ctc-cheer";

export function CheerSection({ cheers }: { cheers: TeamTotals }) {
  const [mine, setMine] = useState<TeamId | null>(null);
  const [local, setLocal] = useState<TeamTotals>(cheers);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem(CHEER_KEY);
      if (v) setMine(v as TeamId);
    } catch {}
  }, []);
  useEffect(() => setLocal(cheers), [cheers]);

  const total = Math.max(1, Object.values(local).reduce((a, b) => a + b, 0));

  async function pick(team: TeamId) {
    if (busy || team === mine) return;
    const prev = mine;
    setBusy(true);
    setMine(team);
    setLocal((c) => ({ ...c, [team]: c[team] + 1, ...(prev ? { [prev]: Math.max(0, c[prev] - 1) } : {}) }));
    try {
      localStorage.setItem(CHEER_KEY, team);
    } catch {}
    try {
      const confetti = (await import("canvas-confetti")).default;
      const t = TEAMS.find((x) => x.id === team)!;
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.7 }, colors: [t.color, "#ffffff", "#c9a24b"], disableForReducedMotion: true });
      await fetch("/api/cheer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ team, prev }) });
    } catch {}
    setBusy(false);
  }

  return (
    <section className="section">
      <div className="section-title">
        <h2>Who are you cheering for?</h2>
        <small>Tap a team</small>
      </div>
      <div className="team-grid">
        {TEAMS.map((t) => (
          <button
            key={t.id}
            className={`team-card ${t.id}${mine === t.id ? " picked" : ""}`}
            style={{ background: t.gradient }}
            onClick={() => pick(t.id)}
            aria-pressed={mine === t.id}
          >
            {mine === t.id && <span className="tc-badge">Your pick ✓</span>}
            <span className="tc-name">{t.name}</span>
            <span className="tc-sub">
              <Icon name="heart" width={14} height={14} /> {local[t.id]} cheers
            </span>
          </button>
        ))}
      </div>
      <div className="cheer-bars" aria-hidden>
        {TEAMS.map((t) => (
          <i key={t.id} style={{ width: `${(local[t.id] / total) * 100}%`, background: t.color }} />
        ))}
      </div>
    </section>
  );
}

export function LockedTeaser({ onRules }: { onRules?: () => void }) {
  return (
    <section className="section">
      <div className="locked">
        <div className="lock-ic"><Icon name="lock" width={24} height={24} /></div>
        <h3>Live leaderboard unlocks Saturday, 8:00 AM</h3>
        <p>Every game win is +10, runner-up is +5. Watch the points climb live right here.</p>
        <div className="ghost-rows">
          {TEAMS.map((t) => (
            <div key={t.id} className="ghost-row">
              <span className="dot" style={{ background: t.color, width: 12, height: 12 }} />
              {t.name}
              <span className="q">???</span>
            </div>
          ))}
        </div>
        {onRules && (
          <button className="btn btn-gold btn-block" style={{ marginTop: 16 }} onClick={onRules}>
            <Icon name="list" /> Read the Do's &amp; Don'ts
          </button>
        )}
      </div>
    </section>
  );
}
