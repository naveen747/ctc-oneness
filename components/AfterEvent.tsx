"use client";
import { useMemo } from "react";
import { teamById } from "@/lib/teams";
import { VERSES } from "@/lib/content";
import { buildRecap } from "@/lib/recap";
import type { Board } from "@/lib/types";
import { useCountUp } from "./Scoreboard";
import Icon from "./Icon";

const PSALM = VERSES[0]; // Psalm 133:1 — unity

export function PhotoHero() {
  return (
    <section className="photo-hero">
      <a className="photo-frame" href="/group-1600.jpg" target="_blank" rel="noopener" aria-label="Open the full group photo">
        <img
          src="/group-900.jpg"
          srcSet="/group-900.jpg 900w, /group-1600.jpg 1600w"
          sizes="(max-width: 560px) 100vw, 560px"
          alt="The CTC family together at Khedda Resorts, 10 October 2026"
          width={1600}
          height={1069}
        />
        <span className="photo-tag">📍 Khedda Resorts · 10 Oct 2026</span>
        <span className="photo-zoom">Tap to view full photo</span>
      </a>
      <div className="thanks-card">
        <div className="church-mini">Christalaya Telugu Church · CTC</div>
        <h1 className="wordmark thanks-word">ONENESS</h1>
        <h2 className="thanks-title">Thank you, CTC family! 💛</h2>
        <p className="thanks-text">
          From the littlest kids to the grandparents, every one of you made Khedda feel like one big family. Thank you for
          every game played, every cheer shouted, every ride shared and every smile in this photo. Truly{" "}
          <em>connected in faith, united in love</em>.
        </p>
        <blockquote className="thanks-verse">
          <p>“{PSALM.en}”</p>
          <p lang="te" className="te">{PSALM.te}</p>
          <cite>{PSALM.ref}</cite>
        </blockquote>
      </div>
    </section>
  );
}

function Num({ value, label }: { value: number; label: string }) {
  const v = useCountUp(value, 1400);
  return (
    <div className="stat">
      <b>{v}</b>
      <span>{label}</span>
    </div>
  );
}

export function Recap({ board, onScores }: { board: Board; onScores: () => void }) {
  const recap = useMemo(() => buildRecap(board), [board]);
  const { ranked, champions, numbers, facts } = recap;
  const played = (board.results ?? []).length;

  // Podium order: 2nd, 1st, 3rd (by sorted position), 4th below
  const podium = [ranked[1], ranked[0], ranked[2]].filter(Boolean);
  const heights = [96, 128, 76];

  return (
    <>
      {numbers.length > 0 && (
        <section className="section">
          <div className="section-title"><h2>The day in numbers</h2></div>
          <div className="stats">
            {numbers.map((n) => <Num key={n.label} value={n.value} label={n.label} />)}
          </div>
        </section>
      )}

      {played > 0 && (
        <section className="section">
          <div className="section-title">
            <h2>Final standings</h2>
            <button className="btn btn-ghost btn-xs" onClick={onScores}>Full scores <Icon name="arrow" /></button>
          </div>
          <div className="card podium-card">
            {champions.length > 0 && (
              <div className="champ-line">
                <Icon name="crown" /> {champions.length === 1 ? "Champions" : "Joint champions"}:{" "}
                <b>{champions.map((c) => teamById(c).name).join(" & ")}</b>
              </div>
            )}
            <div className="podium">
              {podium.map((r, i) => {
                const t = teamById(r.team);
                return (
                  <div key={r.team} className="pod-col" style={{ animationDelay: `${[200, 0, 400][i]}ms` }}>
                    <div className="pod-top">
                      <span className="pod-medal">{r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : "🥉"}</span>
                      <b className="pod-name">{t.name}</b>
                      <span className="pod-pts">{r.pts} pts</span>
                    </div>
                    <div className={`pod-block ${t.id}`} style={{ height: heights[i], background: t.gradient }}>
                      <span>{r.rank}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            {ranked[3] && (
              <div className="pod-fourth">
                <span className="lb-rank">{ranked[3].rank}</span>
                <span className="dot" style={{ background: teamById(ranked[3].team).color, width: 12, height: 12 }} />
                <b>{teamById(ranked[3].team).name}</b>
                <span className="grow" />
                <b style={{ color: teamById(ranked[3].team).deep }}>{ranked[3].pts} pts</b>
              </div>
            )}
            <p className="pod-note">Every team played with heart. In the end, we all won together. 🙌</p>
          </div>
        </section>
      )}

      {facts.length > 0 && (
        <section className="section">
          <div className="section-title"><h2>Fun facts</h2><small>From the scoreboard</small></div>
          <div className="facts">
            {facts.map((f, i) => {
              const t = f.team ? teamById(f.team) : null;
              return (
                <div
                  key={f.title}
                  className="fact"
                  style={{ animationDelay: `${Math.min(i, 8) * 60}ms`, ...(t ? { borderLeftColor: t.color, background: `linear-gradient(90deg, ${t.soft}, var(--paper) 55%)` } : {}) }}
                >
                  <span className="fact-emoji" aria-hidden>{f.emoji}</span>
                  <div>
                    <b>{f.title}</b>
                    <p>{f.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}

export function FeedbackCTA({ done, open, onGo }: { done: boolean; open: boolean; onGo: () => void }) {
  if (!open && !done) return null;
  return (
    <section className="section">
      <button className={`feedback-cta${done ? " done" : ""}`} onClick={onGo}>
        <span className="fc-emoji" aria-hidden>{done ? "💛" : "📝"}</span>
        <span className="fc-text">
          <b>{done ? "Thanks for your feedback!" : "How was your day? Tell us!"}</b>
          <small>{done ? "See the live joy meter & favourite games" : "🔒 100% anonymous · takes about 2 minutes"}</small>
        </span>
        <Icon name="arrow" />
      </button>
    </section>
  );
}
