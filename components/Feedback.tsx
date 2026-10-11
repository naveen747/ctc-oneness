"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { GameOption, PublicFeedbackSummary } from "@/lib/feedback";
import Icon from "./Icon";

export const FEEDBACK_DONE_KEY = "ctc-feedback-done-v1";
const DRAFT_KEY = "ctc-feedback-draft-v1";

const FACES = [
  { e: "😞", l: "Poor" },
  { e: "😕", l: "Okay" },
  { e: "🙂", l: "Good" },
  { e: "😄", l: "Great" },
  { e: "😍", l: "Loved it" },
];
const FEE_LABELS = ["Too high", "A bit high", "Fair", "Good value", "Great value"];
const FEE_FACES = ["😬", "🤔", "👌", "👍", "💯"];

export const joyFace = (v: number) => (v >= 9.5 ? "🥳" : v >= 8.5 ? "🤩" : v >= 7 ? "😄" : v >= 5 ? "🙂" : v >= 3 ? "😕" : "😢");
export const joyWord = (v: number) =>
  v >= 9.5 ? "Best day ever!" : v >= 8.5 ? "Absolutely loved it" : v >= 7 ? "Had a great time" : v >= 5 ? "It was nice" : v >= 3 ? "Could be better" : "Not my day";

interface FeedData {
  open: boolean;
  options: GameOption[];
  summary: PublicFeedbackSummary;
}

interface Draft {
  food: number | null;
  carpool: number | null;
  resort: number | null;
  fees: number | null;
  games: number[];
  overall: number | null;
  more: "yes" | "maybe" | "no" | null;
  comment: string;
}
const emptyDraft: Draft = { food: null, carpool: null, resort: null, fees: null, games: [], overall: null, more: null, comment: "" };

function useFeedbackData(active: boolean) {
  const [data, setData] = useState<FeedData | null>(null);
  const [error, setError] = useState(false);
  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/feedback", { cache: "no-store" });
      if (!res.ok) throw new Error();
      setData(await res.json());
      setError(false);
    } catch {
      setError(true);
    }
  }, []);
  useEffect(() => {
    if (!active) return;
    load();
    const id = setInterval(() => document.visibilityState === "visible" && load(), 8000);
    return () => clearInterval(id);
  }, [active, load]);
  return { data, error, reload: load };
}

/* ------------------------------ Inputs ------------------------------- */

function Scale({ value, onChange, labels, faces, name }: { value: number | null; onChange: (v: number) => void; labels: string[]; faces: string[]; name: string }) {
  return (
    <div className="scale" role="radiogroup" aria-label={name}>
      {labels.map((l, i) => (
        <button key={l} type="button" role="radio" aria-checked={value === i + 1} className={`scale-btn${value === i + 1 ? " on" : ""}`} onClick={() => onChange(i + 1)}>
          <span className="sf">{faces[i]}</span>
          <span className="sl">{l}</span>
        </button>
      ))}
    </div>
  );
}

function Q({ n, title, hint, done, children }: { n: number; title: string; hint?: string; done: boolean; children: React.ReactNode }) {
  return (
    <section className={`q card${done ? " done" : ""}`}>
      <div className="q-head">
        <span className="q-n">{done ? <Icon name="check" /> : n}</span>
        <div>
          <h3>{title}</h3>
          {hint && <p>{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export function JoySlider({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  const v = value ?? 0;
  const pct = value ? ((value - 1) / 9) * 100 : 0;
  return (
    <div className="joy-input">
      <div className="joy-face" key={value ?? 0}>{value ? joyFace(value) : "👆"}</div>
      <div className="joy-word">{value ? `${value}/10 · ${joyWord(value)}` : "Slide to rate your day"}</div>
      <input
        type="range"
        min={1}
        max={10}
        step={1}
        value={value ?? 5}
        onChange={(e) => onChange(Number(e.target.value))}
        onClick={(e) => onChange(Number((e.target as HTMLInputElement).value))}
        className={`joy-range${value ? "" : " untouched"}`}
        style={{ ["--pct" as string]: `${pct}%` }}
        aria-label="Overall enjoyment from 1 to 10"
        aria-valuetext={value ? `${v} out of 10` : "not rated"}
      />
      <div className="joy-ticks" aria-hidden><span>1</span><span>5</span><span>10</span></div>
    </div>
  );
}

/* ------------------------------ Results ------------------------------ */

export function GameTrends({ summary, compact = false }: { summary: PublicFeedbackSummary; compact?: boolean }) {
  const games = summary.games.filter((g) => g.score > 0);
  const max = Math.max(1, ...games.map((g) => g.score));
  if (!games.length)
    return (
      <div className="card empty">
        <div className="big">🎯</div>
        <b>No votes yet. Be the first!</b>
      </div>
    );
  return (
    <div className="card trend-card">
      {(compact ? games.slice(0, 5) : games).map((g, i) => (
        <div key={g.id} className="trend-row">
          <span className={`lb-rank${i < 3 ? ` r${i + 1}` : ""}`}>{i + 1}</span>
          <div className="trend-main">
            <div className="trend-top">
              <b>{g.name}</b>
              <span>{g.score} {g.score === 1 ? "pt" : "pts"}</span>
            </div>
            <div className="trend-bar"><i style={{ width: `${(g.score / max) * 100}%` }} /></div>
            <small>
              In {g.votes} top-4 list{g.votes === 1 ? "" : "s"}
              {g.firsts ? ` · ${g.firsts}× favourite` : ""}
            </small>
          </div>
        </div>
      ))}
      <p className="trend-note">1st pick = 4 pts · 2nd = 3 · 3rd = 2 · 4th = 1</p>
    </div>
  );
}

export function JoyMeter({ value, count, mine }: { value: number | null; count: number; mine?: number | null }) {
  const [shown, setShown] = useState(1);
  useEffect(() => {
    const t = setTimeout(() => setShown(value ?? 1), 250);
    return () => clearTimeout(t);
  }, [value]);
  const angle = -90 + ((shown - 1) / 9) * 180;
  const segs = ["#e5484d", "#f08a3c", "#f2c94c", "#8fd16a", "#2fb26a"];
  const arc = (a0: number, a1: number) => {
    const p = (a: number) => [100 + 80 * Math.cos(((a - 180) * Math.PI) / 180), 100 + 80 * Math.sin(((a - 180) * Math.PI) / 180)];
    const [x0, y0] = p(a0);
    const [x1, y1] = p(a1);
    return `M${x0.toFixed(2)},${y0.toFixed(2)} A80,80 0 0 1 ${x1.toFixed(2)},${y1.toFixed(2)}`;
  };
  return (
    <div className="joy-meter">
      <svg viewBox="0 0 200 118" role="img" aria-label={value ? `Average enjoyment ${value} out of 10` : "No ratings yet"}>
        {segs.map((c, i) => (
          <path key={c} d={arc(i * 36 + 1.5, (i + 1) * 36 - 1.5)} stroke={c} strokeWidth={18} fill="none" strokeLinecap="round" />
        ))}
        <g className="needle" style={{ transform: `rotate(${angle}deg)` }}>
          <path d="M100 100 L96 100 L100 30 L104 100 Z" fill="#13213f" />
        </g>
        <circle cx="100" cy="100" r="9" fill="#13213f" />
        <circle cx="100" cy="100" r="4" fill="#e2c27a" />
        <text x="22" y="116" className="jm-end">😢</text>
        <text x="166" y="116" className="jm-end">🥳</text>
      </svg>
      <div className="jm-readout">
        <span className="jm-face">{value ? joyFace(value) : "⏳"}</span>
        <b>{value ? value.toFixed(1) : "–"}<small>/10</small></b>
        <span className="jm-word">{value ? joyWord(value) : "Waiting for ratings"}</span>
        <span className="jm-count">from {count} {count === 1 ? "person" : "people"}{mine ? ` · you said ${mine}/10` : ""}</span>
      </div>
    </div>
  );
}

/* ------------------------------ Page --------------------------------- */

async function celebrate() {
  try {
    const confetti = (await import("canvas-confetti")).default;
    const colors = ["#1F9D55", "#D7263D", "#1E6FD9", "#E8A800", "#c9a24b", "#ffffff"];
    confetti({ particleCount: 140, spread: 100, origin: { y: 0.55 }, colors, disableForReducedMotion: true });
    setTimeout(() => confetti({ particleCount: 70, angle: 60, spread: 65, origin: { x: 0, y: 0.7 }, colors, disableForReducedMotion: true }), 300);
    setTimeout(() => confetti({ particleCount: 70, angle: 120, spread: 65, origin: { x: 1, y: 0.7 }, colors, disableForReducedMotion: true }), 500);
  } catch {}
}

export default function FeedbackView({ active, onDone }: { active: boolean; onDone: () => void }) {
  const { data, error, reload } = useFeedbackData(active);
  const [done, setDone] = useState(false);
  const [mine, setMine] = useState<number | null>(null);
  const [d, setD] = useState<Draft>(emptyDraft);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);
  const hp = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const v = localStorage.getItem(FEEDBACK_DONE_KEY);
      if (v) {
        setDone(true);
        setMine(Number(v) || null);
      }
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) setD({ ...emptyDraft, ...JSON.parse(draft) });
    } catch {}
  }, []);
  useEffect(() => {
    if (done) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
    } catch {}
  }, [d, done]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    setErr("");
    setD((x) => ({ ...x, [k]: v }));
  };
  const toggleGame = (id: number) => {
    setErr("");
    setD((x) => {
      if (x.games.includes(id)) return { ...x, games: x.games.filter((g) => g !== id) };
      if (x.games.length >= 4) return x;
      return { ...x, games: [...x.games, id] };
    });
  };

  const options = data?.options ?? [];
  // Drop any saved picks for games that are no longer in the list
  useEffect(() => {
    if (!data) return;
    const ids = new Set(data.options.map((g) => g.id));
    setD((x) => (x.games.every((g) => ids.has(g)) ? x : { ...x, games: x.games.filter((g) => ids.has(g)) }));
  }, [data]);
  const needGames = options.length > 0;
  const want = Math.min(4, options.length);
  const answered = [d.food, d.carpool, d.resort, d.fees, !needGames || d.games.length ? 1 : null, d.overall, d.more].filter((x) => x !== null).length;
  const missing: string[] = [];
  if (d.food === null) missing.push("food");
  if (d.carpool === null) missing.push("carpool");
  if (d.resort === null) missing.push("resort");
  if (d.fees === null) missing.push("registration fee");
  if (needGames && !d.games.length) missing.push("favourite games");
  if (d.overall === null) missing.push("overall day");
  if (d.more === null) missing.push("more events");

  async function submit() {
    if (missing.length) {
      setErr(`Almost there! Please answer: ${missing.join(", ")}.`);
      return;
    }
    setSending(true);
    setErr("");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          food: d.food,
          carpool: d.carpool,
          resort: d.resort,
          fees: d.fees,
          overall: d.overall,
          more_events: d.more,
          top_games: d.games,
          comment: d.comment,
          website: hp.current?.value ?? "",
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? "Couldn't send. Please try again.");
      try {
        localStorage.setItem(FEEDBACK_DONE_KEY, String(d.overall));
        localStorage.removeItem(DRAFT_KEY);
      } catch {}
      setMine(d.overall);
      setDone(true);
      onDone();
      window.scrollTo({ top: 0, behavior: "smooth" });
      celebrate();
      setTimeout(reload, 1500);
      setTimeout(reload, 7000);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't send. Please try again.");
    } finally {
      setSending(false);
    }
  }

  const summary = data?.summary;
  const me = summary?.moreEvents;
  const meTotal = me ? me.yes + me.maybe + me.no : 0;

  /* ---------- After submitting: joy meter + live trends ---------- */
  if (done) {
    return (
      <main>
        <section className="section">
          <div className="joy-done card">
            <div className="hearts" aria-hidden>{["💛", "💚", "❤️", "💙", "💛"].map((h, i) => <span key={i} style={{ left: `${10 + i * 20}%`, animationDelay: `${i * 0.4}s` }}>{h}</span>)}</div>
            <div className="eyebrow">Your feedback is in</div>
            <h2>Thank you for being part of ONENESS!</h2>
            <p className="muted">Here's how the whole CTC family enjoyed the day, live:</p>
            {summary ? <JoyMeter value={summary.joy} count={summary.count} mine={mine} /> : <p className="muted">Loading the joy meter…</p>}
            {me && meTotal > 0 && (
              <div className="more-share">
                <div className="ms-bar">
                  <i style={{ width: `${(me.yes / meTotal) * 100}%`, background: "#2fb26a" }} />
                  <i style={{ width: `${(me.maybe / meTotal) * 100}%`, background: "#f2c94c" }} />
                  <i style={{ width: `${(me.no / meTotal) * 100}%`, background: "#e5484d" }} />
                </div>
                <p><b>{Math.round((me.yes / meTotal) * 100)}%</b> want more events like this! 🙌</p>
              </div>
            )}
          </div>
        </section>
        <section className="section">
          <div className="section-title">
            <h2>Games everyone loved</h2>
            <span className="live-pill"><span className="live-dot" /> LIVE</span>
          </div>
          {summary ? <GameTrends summary={summary} /> : null}
        </section>
        <section className="section">
          <div className="card verse-card">
            <div className="eyebrow">Till we meet again</div>
            <p className="q-en">“This is the day which the LORD hath made; we will rejoice and be glad in it.”</p>
            <p className="q-te" lang="te">ఇది యెహోవా ఏర్పాటు చేసిన దినము దీనియందు మనము ఉత్సహించి సంతోషించెదము.</p>
            <div className="ref">Psalm 118:24</div>
            <button
              className="btn btn-gold"
              style={{ marginTop: 16 }}
              onClick={async () => {
                const shareData = { title: "ONENESS · CTC Family Retreat", text: "What a day with the CTC family! 💛 Share your feedback too:", url: window.location.origin };
                try {
                  if (navigator.share) await navigator.share(shareData);
                  else {
                    await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
                    setCopied(true);
                  }
                } catch {}
              }}
            >
              <Icon name="heart" /> {copied ? "Link copied!" : "Share the joy"}
            </button>
          </div>
        </section>
      </main>
    );
  }

  /* ---------- Form ---------- */
  if (data && !data.open)
    return (
      <section className="section">
        <div className="card empty">
          <div className="big">💛</div>
          <b>Feedback is closed now.</b>
          <div className="muted">Thank you to everyone who shared!</div>
        </div>
        {summary && <div style={{ marginTop: 12 }}><JoyMeter value={summary.joy} count={summary.count} /></div>}
      </section>
    );

  return (
    <main>
      <section className="section">
        <div className="anon-banner">
          <span className="anon-ic">🔒</span>
          <div>
            <b>Your feedback is 100% anonymous</b>
            <p>We don't ask for your name, phone or email, and nothing links your answers to you. Be honest, it helps us plan the next one!</p>
          </div>
        </div>
      </section>

      <div className="fb-progress" aria-hidden>
        <div className="fb-progress-bar"><i style={{ width: `${(answered / 7) * 100}%` }} /></div>
        <span>{answered}/7</span>
      </div>

      <div className="fb-form">
        <Q n={1} title="How was the food? 🍛" hint="Breakfast, lunch & hi-tea" done={d.food !== null}>
          <Scale name="Food" value={d.food} onChange={(v) => set("food", v)} labels={FACES.map((f) => f.l)} faces={FACES.map((f) => f.e)} />
        </Q>

        <Q n={2} title="How was your carpool experience? 🚗" done={d.carpool !== null}>
          <Scale name="Carpool" value={d.carpool && d.carpool > 0 ? d.carpool : null} onChange={(v) => set("carpool", v)} labels={FACES.map((f) => f.l)} faces={FACES.map((f) => f.e)} />
          <button type="button" className={`pill-opt${d.carpool === 0 ? " on" : ""}`} onClick={() => set("carpool", 0)}>
            I came on my own / didn't use carpool
          </button>
        </Q>

        <Q n={3} title="How did you like Khedda Resorts? 🌴" hint="Venue, facilities, swimming area" done={d.resort !== null}>
          <Scale name="Resort" value={d.resort} onChange={(v) => set("resort", v)} labels={FACES.map((f) => f.l)} faces={FACES.map((f) => f.e)} />
        </Q>

        <Q n={4} title="How did you feel about the registration fee? 🎟️" done={d.fees !== null}>
          <Scale name="Registration fee" value={d.fees} onChange={(v) => set("fees", v)} labels={FEE_LABELS} faces={FEE_FACES} />
        </Q>

        <Q
          n={5}
          title="Your top 4 games 🏅"
          hint={options.length ? "Playing or watching. Tap in order, favourite first." : "Loading the games…"}
          done={!needGames || d.games.length > 0}
        >
          {error && !data && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={reload}><Icon name="refresh" /> Retry loading games</button>
          )}
          <div className="game-picks">
            {options.map((g) => {
              const idx = d.games.indexOf(g.id);
              return (
                <button
                  key={g.id}
                  type="button"
                  className={`game-pick${idx >= 0 ? ` on r${idx + 1}` : ""}`}
                  onClick={() => toggleGame(g.id)}
                  disabled={idx < 0 && d.games.length >= 4}
                  aria-pressed={idx >= 0}
                >
                  <span className="gp-rank">{idx >= 0 ? ["🥇", "🥈", "🥉", "🏅"][idx] : "+"}</span>
                  <span className="gp-name">{g.name}</span>
                  {idx >= 0 && <span className="gp-n">#{idx + 1}</span>}
                </button>
              );
            })}
          </div>
          {d.games.length > 0 && (
            <div className="row" style={{ marginTop: 10, justifyContent: "space-between" }}>
              <small className="muted">{d.games.length}/{want} picked{d.games.length < want ? `, pick ${want - d.games.length} more` : " ✓"}</small>
              <button type="button" className="btn btn-ghost btn-xs" onClick={() => set("games", [])}>Clear</button>
            </div>
          )}
        </Q>

        <Q n={6} title="Your enjoyment meter 🎢" hint="How much did you enjoy the day overall?" done={d.overall !== null}>
          <JoySlider value={d.overall} onChange={(v) => set("overall", v)} />
        </Q>

        <Q n={7} title="Should we do more events like this? 🙌" done={d.more !== null}>
          <div className="more-opts">
            {([
              ["yes", "🙌", "Yes, definitely!"],
              ["maybe", "🤔", "Maybe"],
              ["no", "🙂", "Not really"],
            ] as const).map(([v, e, l]) => (
              <button key={v} type="button" className={`more-opt${d.more === v ? " on" : ""}`} onClick={() => set("more", v)}>
                <span>{e}</span>
                {l}
              </button>
            ))}
          </div>
        </Q>

        <section className="q card">
          <div className="q-head">
            <span className="q-n" style={{ background: "var(--gold-soft)", color: "#6f5414" }}>✎</span>
            <div>
              <h3>Anything else? <span className="opt">(optional)</span></h3>
              <p>Suggestions, a favourite moment, a thank-you… Skip any names if you'd like to stay anonymous.</p>
            </div>
          </div>
          <textarea className="textarea" maxLength={1000} placeholder="Type your thoughts here…" value={d.comment} onChange={(e) => set("comment", e.target.value)} />
          <div className="char-count">{d.comment.length}/1000</div>
        </section>

        <input ref={hp} type="text" name="website" tabIndex={-1} autoComplete="off" className="hp" aria-hidden />

        {err && <div className="fb-err" role="alert">{err}</div>}
        <button className="btn btn-primary btn-block fb-submit" disabled={sending} onClick={submit}>
          {sending ? "Sending…" : <><Icon name="heart" /> Send my feedback</>}
        </button>
        <p className="muted" style={{ textAlign: "center", fontSize: 12, marginTop: 8 }}>🔒 Anonymous · one response per phone please</p>
      </div>

      {summary && summary.count > 0 && (
        <section className="section">
          <div className="section-title">
            <h2>Games everyone loved</h2>
            <span className="live-pill"><span className="live-dot" /> LIVE</span>
          </div>
          <GameTrends summary={summary} compact />
        </section>
      )}
    </main>
  );
}
