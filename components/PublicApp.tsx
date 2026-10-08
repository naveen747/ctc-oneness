"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useBoard, useNow } from "@/lib/useBoard";
import { EVENT } from "@/lib/content";
import { TEAMS, type TeamId } from "@/lib/teams";
import type { TeamTotals } from "@/lib/types";
import Splash from "./Splash";
import Countdown from "./Countdown";
import VerseCard from "./VerseCard";
import Icon from "./Icon";
import { CheerSection, EventInfo, Hero, LockedTeaser } from "./Hype";
import { Leaderboard, RaceChart, ResultsFeed, Stats } from "./Scoreboard";
import { RulesView, TeamsView } from "./TeamsRules";

type Tab = "home" | "scores" | "teams" | "rules";
const zero: TeamTotals = { green: 0, red: 0, blue: 0, yellow: 0 };
const START = Date.parse(EVENT.startISO);

async function burst(colors: string[], big = false) {
  try {
    const confetti = (await import("canvas-confetti")).default;
    const opts = { colors: [...colors, "#ffffff", "#c9a24b"], disableForReducedMotion: true };
    confetti({ ...opts, particleCount: big ? 160 : 90, spread: big ? 110 : 75, origin: { y: 0.6 } });
    if (big) {
      setTimeout(() => confetti({ ...opts, particleCount: 80, angle: 60, spread: 60, origin: { x: 0, y: 0.7 } }), 250);
      setTimeout(() => confetti({ ...opts, particleCount: 80, angle: 120, spread: 60, origin: { x: 1, y: 0.7 } }), 400);
    }
  } catch {}
}

export default function PublicApp() {
  const { board, offset, online, lastOk } = useBoard();
  const now = useNow(offset);
  const [splash, setSplash] = useState(true);
  const [tab, setTab] = useState<Tab>("home");
  const [gains, setGains] = useState<{ team: TeamId; pts: number; key: number }[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [seenResults, setSeenResults] = useState(0);
  const prevTotals = useRef<TeamTotals | null>(null);
  const prevOpen = useRef<boolean | null>(null);

  const open = !!board?.open;
  const totals = board?.totals ?? zero;
  const results = board?.results ?? [];

  // Celebrate new points
  useEffect(() => {
    if (!board?.open || !board.totals) return;
    const prev = prevTotals.current;
    prevTotals.current = board.totals;
    if (!prev || splash) return;
    const g = TEAMS.filter((t) => board.totals![t.id] > prev[t.id]).map((t, i) => ({
      team: t.id,
      pts: board.totals![t.id] - prev[t.id],
      key: Date.now() + i,
    }));
    if (!g.length) return;
    setGains(g);
    burst(g.map((x) => TEAMS.find((t) => t.id === x.team)!.color));
    const latest = board.results?.[0];
    if (latest) {
      const names = latest.winners.map((w) => TEAMS.find((t) => t.id === w)?.name).join(" & ");
      setToast(`🏆 ${latest.name}: ${names} ${latest.winners.length > 1 ? "tie for the win!" : "won!"}`);
    }
  }, [board, splash]);

  useEffect(() => {
    if (!gains.length) return;
    const t = setTimeout(() => setGains([]), 2200);
    return () => clearTimeout(t);
  }, [gains]);

  // Leaderboard opening moment
  useEffect(() => {
    if (!board) return;
    if (prevOpen.current === false && board.open) {
      burst(TEAMS.map((t) => t.color), true);
      setToast("🎉 The leaderboard is LIVE!");
    }
    prevOpen.current = board.open;
  }, [board]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (tab === "scores") setSeenResults(results.length);
  }, [tab, results.length]);

  const go = useCallback((t: Tab) => {
    setTab(t);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const endSplash = useCallback(() => setSplash(false), []);
  const ago = lastOk ? Math.max(0, Math.round((Date.now() - lastOk) / 1000)) : null;

  // Time and the random verse only exist in the browser — render after mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // Coming back from the carpool page: don't replay the verse intro.
    const url = new URL(window.location.href);
    if (url.searchParams.has("skipintro")) {
      setSplash(false);
      url.searchParams.delete("skipintro");
      window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    }
    setMounted(true);
  }, []);
  if (!mounted)
    return (
      <div className="splash" aria-busy="true">
        <div className="rays" aria-hidden />
        <img className="splash-logo" src="/logo.png" alt="Christalaya Telugu Church" width={112} height={112} />
      </div>
    );

  return (
    <>
      {splash && <Splash ready={!!board} onDone={endSplash} />}

      <div className="shell">
        <div className="topbar">
          <img src="/logo.png" alt="" width={36} height={36} />
          <div className="brand">
            <b>ONENESS</b>
            <span>CTC Family Retreat 2026</span>
          </div>
          <div className="spacer" />
          {open ? (
            <span className="live-pill"><span className="live-dot" /> LIVE</span>
          ) : (
            <span className="chip">10 OCT · 8 AM</span>
          )}
        </div>

        {board?.announcement ? (
          <div className="announce" style={{ marginTop: 6 }}>
            <Icon name="megaphone" />
            <span>{board.announcement}</span>
          </div>
        ) : null}

        {!online && (
          <div className="announce" style={{ marginTop: 8, background: "#fdebec", borderColor: "rgba(179,38,47,.3)", color: "#7a1a20" }}>
            <Icon name="refresh" />
            <span>Weak connection — showing the last scores we got. Retrying…</span>
          </div>
        )}

        {tab === "home" && (
          <main>
            {!open ? (
              <>
                <Hero />
                <Countdown
                  now={now}
                  target={START}
                  label="The retreat begins in"
                  when={`${EVENT.dateLabel} · ${EVENT.timeLabel}`}
                />
                <EventInfo />
                <CheerSection cheers={board?.cheers ?? zero} />
                <LockedTeaser onRules={() => go("rules")} />
                <section className="section"><VerseCard /></section>
              </>
            ) : (
              <>
                <Hero compact />
                <section className="section">
                  <div className="section-title">
                    <h2>Live standings</h2>
                    <small>{ago !== null && ago < 90 ? "Updated just now" : "Auto-updating"}</small>
                  </div>
                  <Leaderboard totals={totals} wins={board?.wins} gains={gains} />
                </section>
                <section className="section">
                  <div className="section-title">
                    <h2>Latest result</h2>
                    {results.length > 1 && (
                      <button className="btn btn-ghost btn-xs" onClick={() => go("scores")}>
                        All results <Icon name="arrow" />
                      </button>
                    )}
                  </div>
                  <ResultsFeed results={results} limit={1} />
                </section>
                <CheerSection cheers={board?.cheers ?? zero} />
                <section className="section"><VerseCard /></section>
              </>
            )}
          </main>
        )}

        {tab === "scores" && (
          <main>
            {!open ? (
              <>
                <Countdown now={now} target={START} label="Leaderboard unlocks in" when="Saturday, 10 Oct · 8:00 AM" />
                <LockedTeaser onRules={() => go("rules")} />
              </>
            ) : (
              <>
                <section className="section">
                  <div className="section-title"><h2>Scoreboard</h2><small>Win +10 · Runner-up +5</small></div>
                  <Leaderboard totals={totals} wins={board?.wins} gains={gains} />
                </section>
                {board?.wins && (
                  <section className="section">
                    <Stats totals={totals} wins={board.wins} games={results.length} />
                  </section>
                )}
                <section className="section">
                  <div className="section-title"><h2>The race</h2><small>Points after each game</small></div>
                  <RaceChart timeline={board?.timeline ?? []} />
                </section>
                <section className="section">
                  <div className="section-title"><h2>Game results</h2><small>{results.length} played</small></div>
                  <ResultsFeed results={results} />
                </section>
              </>
            )}
          </main>
        )}

        {tab === "teams" && <TeamsView members={board?.members} open={open} />}
        {tab === "rules" && (
          <main>
            <RulesView />
            <EventInfo />
          </main>
        )}

        <p className="footer-note">
          Christalaya Telugu Church · Hosa Road, Bengaluru
          <br />
          Made with ♥ for the CTC family
        </p>
      </div>

      {toast && <div className="toast" role="status">{toast}</div>}

      <nav className="nav" aria-label="Sections">
        {([
          ["home", "home", "Home"],
          ["scores", "trophy", "Scores"],
          ["teams", "users", "Teams"],
          ["rules", "list", "Rules"],
        ] as [Tab, string, string][]).map(([id, icon, label]) => (
          <button key={id} aria-current={tab === id ? "page" : undefined} onClick={() => go(id)}>
            <Icon name={icon} />
            {label}
            {id === "scores" && open && tab !== "scores" && results.length > seenResults && <span className="badge" />}
          </button>
        ))}
      </nav>
    </>
  );
}
