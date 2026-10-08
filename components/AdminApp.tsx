"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CATEGORIES, TEAMS, teamById, type TeamId } from "@/lib/teams";
import type { ResultItem, TeamTotals } from "@/lib/types";
import Icon from "./Icon";

interface AdminState {
  settings: { announcement: string; leaderboard_mode: "auto" | "open" | "closed" };
  publicOpen: boolean;
  participants: { id: number; name: string; team: TeamId; category: string | null }[];
  games: { id: number; name: string; sort_order: number }[];
  results: ResultItem[];
  totals: TeamTotals;
  cheers: TeamTotals;
  voidedCount: number;
}

type Tab = "score" | "games" | "people" | "settings";
type Pick = "none" | "win" | "run";

interface ConfirmReq {
  title: string;
  body: React.ReactNode;
  cta: string;
  danger?: boolean;
  typeWord?: string;
  run: (typed: string) => Promise<void> | void;
}

const timeFmt = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

export default function AdminApp() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [state, setState] = useState<AdminState | null>(null);
  const [tab, setTab] = useState<Tab>("score");
  const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmReq | null>(null);

  const flash = useCallback((msg: string, err = false) => {
    setToast({ msg, err });
    setTimeout(() => setToast(null), err ? 4500 : 2600);
  }, []);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/admin", { cache: "no-store" });
    if (res.status === 401) return setAuthed(false);
    const data = await res.json();
    if (!res.ok) return flash(data.error ?? "Could not load", true);
    setAuthed(true);
    setState(data);
  }, [flash]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const act = useCallback(
    async (payload: Record<string, unknown>, okMsg?: string) => {
      setBusy(true);
      try {
        const res = await fetch("/api/admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) {
          setAuthed(false);
          return false;
        }
        if (!res.ok) {
          flash(data.error ?? "Something went wrong", true);
          return false;
        }
        setState(data);
        if (okMsg) flash(okMsg);
        return true;
      } catch {
        flash("Network problem — check your connection and try again", true);
        return false;
      } finally {
        setBusy(false);
      }
    },
    [flash]
  );

  if (authed === null) return <div className="admin-shell"><p className="muted" style={{ paddingTop: 40, textAlign: "center" }}>Loading…</p></div>;
  if (!authed) return <Login onDone={refresh} />;
  if (!state) return null;

  return (
    <div className="admin-shell">
      <div className="topbar">
        <img src="/logo.png" alt="" width={36} height={36} />
        <div className="brand"><b>ADMIN</b><span>Oneness scoreboard control</span></div>
        <div className="spacer" />
        <a className="btn btn-ghost btn-xs" href="/" target="_blank" rel="noopener">View site</a>
      </div>

      <div className="mini-totals">
        {TEAMS.map((t) => (
          <div key={t.id} style={{ background: t.gradient, color: t.id === "yellow" ? "#3d2a00" : "#fff" }}>
            <b>{state.totals[t.id]}</b>{t.short}
          </div>
        ))}
      </div>
      <p className="muted" style={{ fontSize: 12, margin: "8px 2px 0" }}>
        Public leaderboard: <b style={{ color: state.publicOpen ? "#1d7a34" : "#b3262f" }}>{state.publicOpen ? "OPEN" : "LOCKED"}</b>
        {state.settings.leaderboard_mode === "auto" && " (auto-opens Sat 10 Oct, 8:00 AM)"}
      </p>

      <div className="admin-tabs" style={{ marginTop: 10 }}>
        <div className="seg">
          {([["score", "Score"], ["games", "Games"], ["people", "People"], ["settings", "Settings"]] as [Tab, string][]).map(([id, l]) => (
            <button key={id} aria-pressed={tab === id} onClick={() => setTab(id)}>{l}</button>
          ))}
        </div>
      </div>

      {tab === "score" && <ScoreTab state={state} act={act} busy={busy} setConfirm={setConfirm} goGames={() => setTab("games")} />}
      {tab === "games" && <GamesTab state={state} act={act} busy={busy} setConfirm={setConfirm} />}
      {tab === "people" && <PeopleTab state={state} act={act} busy={busy} setConfirm={setConfirm} />}
      {tab === "settings" && <SettingsTab state={state} act={act} busy={busy} setConfirm={setConfirm} onLogout={async () => { await fetch("/api/admin/logout", { method: "POST" }); setAuthed(false); }} />}

      {confirm && <ConfirmModal req={confirm} onClose={() => setConfirm(null)} />}
      {toast && <div className={`toast${toast.err ? " err" : ""}`} style={{ bottom: 24 }} role="status">{toast.msg}</div>}
    </div>
  );
}

type ActFn = (p: Record<string, unknown>, ok?: string) => Promise<boolean>;
interface TabProps { state: AdminState; act: ActFn; busy: boolean; setConfirm: (c: ConfirmReq) => void }

/* ------------------------------- Login ------------------------------- */

function Login({ onDone }: { onDone: () => void }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const res = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw }) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setErr(data.error ?? "Login failed");
    onDone();
  }
  return (
    <div className="admin-shell" style={{ minHeight: "100dvh", display: "grid", placeItems: "center" }}>
      <form className="card pad" style={{ width: "100%", maxWidth: 400, textAlign: "center" }} onSubmit={submit}>
        <img src="/logo.png" alt="" width={84} height={84} style={{ margin: "4px auto 12px", borderRadius: "50%" }} />
        <h1 style={{ fontFamily: "var(--display)", margin: 0, fontSize: 26 }}>Admin login</h1>
        <p className="muted" style={{ marginTop: 4 }}>Oneness Family Retreat scoreboard</p>
        <div className="field" style={{ textAlign: "left", marginTop: 16 }}>
          <label htmlFor="pw">Password</label>
          <input id="pw" className="input" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus />
        </div>
        {err && <p style={{ color: "#b3262f", fontWeight: 700, fontSize: 14, margin: "10px 0 0" }}>{err}</p>}
        <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} disabled={busy || !pw}>
          {busy ? "Checking…" : "Log in"}
        </button>
      </form>
    </div>
  );
}

/* ------------------------------- Score ------------------------------- */

function ScoreTab({ state, act, busy, setConfirm, goGames }: TabProps & { goGames: () => void }) {
  const scored = new Set(state.results.map((r) => r.gameId));
  const pending = state.games.filter((g) => !scored.has(g.id));
  const [gameId, setGameId] = useState<number | null>(null);
  const [picks, setPicks] = useState<Record<TeamId, Pick>>({ green: "none", red: "none", blue: "none", yellow: "none" });

  useEffect(() => {
    if (!gameId || !pending.some((g) => g.id === gameId)) setGameId(pending[0]?.id ?? null);
  }, [pending, gameId]);

  const cycle = (t: TeamId) =>
    setPicks((p) => ({ ...p, [t]: p[t] === "none" ? "win" : p[t] === "win" ? "run" : "none" }));
  const winners = TEAMS.filter((t) => picks[t.id] === "win").map((t) => t.id);
  const runners = TEAMS.filter((t) => picks[t.id] === "run").map((t) => t.id);
  const game = state.games.find((g) => g.id === gameId);

  function submit() {
    if (!game) return;
    setConfirm({
      title: `Award points for “${game.name}”?`,
      body: (
        <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
          {winners.map((t) => <div key={t}>🏆 <b>{teamById(t).name}</b> — +10</div>)}
          {runners.map((t) => <div key={t}>🥈 <b>{teamById(t).name}</b> — +5</div>)}
          {TEAMS.filter((t) => picks[t.id] === "none").map((t) => <div key={t.id} className="muted">{t.name} — 0</div>)}
        </div>
      ),
      cta: "Yes, add points",
      run: async () => {
        const ok = await act({ action: "scoreGame", gameId: game.id, winners, runners }, "Points added — live on the scoreboard ✓");
        if (ok) setPicks({ green: "none", red: "none", blue: "none", yellow: "none" });
      },
    });
  }

  return (
    <div>
      <section className="section">
        <div className="section-title"><h2>1. Pick the game</h2><small>{pending.length} left</small></div>
        {state.games.length === 0 ? (
          <div className="card empty">
            <b>No games added yet.</b>
            <div style={{ marginTop: 12 }}><button className="btn btn-gold" onClick={goGames}><Icon name="plus" /> Add games</button></div>
          </div>
        ) : pending.length === 0 ? (
          <div className="card empty"><div className="big">🎉</div><b>All games are scored.</b></div>
        ) : (
          <div className="game-list">
            {pending.map((g) => (
              <button key={g.id} className={`game-item${g.id === gameId ? " sel" : ""}`} style={{ cursor: "pointer", textAlign: "left", font: "inherit" }} onClick={() => setGameId(g.id)}>
                <span style={{ width: 22, height: 22, borderRadius: "50%", border: "2px solid var(--gold)", display: "grid", placeItems: "center", flex: "none" }}>
                  {g.id === gameId && <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--maroon)" }} />}
                </span>
                <span className="gi-name">{g.name}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {game && (
        <section className="section">
          <div className="section-title"><h2>2. Tap the results</h2><small>Tap again to change</small></div>
          <p className="muted" style={{ margin: "-6px 2px 12px", fontSize: 13 }}>
            1 tap = <b>Winner (+10)</b> · 2 taps = <b>Runner-up (+5)</b> · 3 taps = clear. For a tie, mark both teams as winners.
          </p>
          <div className="pick-grid">
            {TEAMS.map((t) => {
              const p = picks[t.id];
              return (
                <button
                  key={t.id}
                  className={`pick${p === "win" ? " win" : p === "run" ? " run" : ""}`}
                  onClick={() => cycle(t.id)}
                  style={
                    p === "win"
                      ? { background: t.gradient, color: t.id === "yellow" ? "#3d2a00" : "#fff" }
                      : p === "run"
                      ? { background: t.soft, borderColor: t.color, color: t.deep }
                      : undefined
                  }
                >
                  <span className="p-name"><span className="dot" style={{ background: t.color, width: 12, height: 12, boxShadow: "0 0 0 2px #fff" }} />{t.name}</span>
                  <span className="p-state">{p === "win" ? "🏆 Winner · +10" : p === "run" ? "🥈 Runner-up · +5" : "No points"}</span>
                </button>
              );
            })}
          </div>
          <button className="btn btn-primary btn-block" style={{ marginTop: 14, minHeight: 54, fontSize: 16 }} disabled={busy || !winners.length} onClick={submit}>
            <Icon name="trophy" /> Award points
          </button>
        </section>
      )}

      <section className="section">
        <div className="section-title"><h2>Scored games</h2><small>{state.results.length}</small></div>
        {state.results.length === 0 ? (
          <div className="card empty"><b>Nothing scored yet.</b></div>
        ) : (
          <div className="feed">
            {state.results.map((r) => (
              <div key={r.gameId} className="card res">
                <div className="res-top">
                  <b>{r.name}</b>
                  <time>{timeFmt(r.at)}</time>
                </div>
                <div className="res-teams">
                  {r.winners.map((t) => <span key={t} className="tpill" style={{ background: teamById(t).soft, color: teamById(t).deep }}>🏆 {teamById(t).short} <span className="pts">+10</span></span>)}
                  {r.runners.map((t) => <span key={t} className="tpill" style={{ background: teamById(t).soft, color: teamById(t).deep }}>🥈 {teamById(t).short} <span className="pts">+5</span></span>)}
                  <button
                    className="btn btn-ghost btn-xs"
                    style={{ marginLeft: "auto" }}
                    disabled={busy}
                    onClick={() =>
                      setConfirm({
                        title: `Void “${r.name}” result?`,
                        body: "Its points are removed from the scoreboard (kept in the backup log). The game goes back to the list so you can score it again.",
                        cta: "Void result",
                        danger: true,
                        run: async () => { await act({ action: "voidGame", gameId: r.gameId }, "Result voided"); },
                      })
                    }
                  >
                    <Icon name="undo" /> Void
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* ------------------------------- Games ------------------------------- */

function GamesTab({ state, act, busy, setConfirm }: TabProps) {
  const [text, setText] = useState("");
  const [editing, setEditing] = useState<{ id: number; name: string } | null>(null);
  const scored = new Set(state.results.map((r) => r.gameId));
  const names = text.split("\n").map((s) => s.trim()).filter(Boolean);

  return (
    <div>
      <section className="section">
        <div className="section-title"><h2>Add games</h2><small>Hidden from public until 8 AM</small></div>
        <div className="card pad">
          <div className="field">
            <label htmlFor="games">Game names — one per line</label>
            <textarea id="games" className="textarea" style={{ minHeight: 120 }} placeholder={"Tug of War\nLemon & Spoon\nTreasure Hunt"} value={text} onChange={(e) => setText(e.target.value)} />
          </div>
          <button
            className="btn btn-gold btn-block"
            style={{ marginTop: 12 }}
            disabled={busy || !names.length}
            onClick={async () => { if (await act({ action: "addGames", names }, `${names.length} game${names.length > 1 ? "s" : ""} added`)) setText(""); }}
          >
            <Icon name="plus" /> Add {names.length || ""} game{names.length === 1 ? "" : "s"}
          </button>
        </div>
      </section>
      <section className="section">
        <div className="section-title"><h2>Game order</h2><small>{state.games.length} games</small></div>
        <div className="game-list">
          {state.games.map((g, i) => (
            <div key={g.id} className="game-item">
              <span className="lb-rank" style={{ width: 28, height: 28, fontSize: 13 }}>{i + 1}</span>
              <span className="gi-name">{g.name}{scored.has(g.id) && <> <span className="done-tag">Scored</span></>}</span>
              <button className="btn btn-ghost btn-icon btn-xs" aria-label="Move up" disabled={busy || i === 0} onClick={() => act({ action: "moveGame", id: g.id, dir: "up" })}><Icon name="up" /></button>
              <button className="btn btn-ghost btn-icon btn-xs" aria-label="Move down" disabled={busy || i === state.games.length - 1} onClick={() => act({ action: "moveGame", id: g.id, dir: "down" })}><Icon name="down" /></button>
              <button className="btn btn-ghost btn-icon btn-xs" aria-label="Rename" onClick={() => setEditing({ id: g.id, name: g.name })}><Icon name="edit" /></button>
              <button
                className="btn btn-ghost btn-icon btn-xs"
                aria-label="Delete"
                disabled={busy}
                onClick={() => setConfirm({ title: `Delete “${g.name}”?`, body: scored.has(g.id) ? "This game has points. Void its result on the Score tab first." : "This removes the game from the list.", cta: "Delete game", danger: true, run: async () => { await act({ action: "deleteGame", id: g.id }, "Game deleted"); } })}
              >
                <Icon name="trash" />
              </button>
            </div>
          ))}
        </div>
      </section>
      {editing && (
        <div className="modal-back" onClick={() => setEditing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Rename game</h3>
            <input className="input" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} autoFocus />
            <div className="row" style={{ marginTop: 14 }}>
              <button className="btn btn-ghost grow" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-primary grow" disabled={busy || !editing.name.trim()} onClick={async () => { if (await act({ action: "renameGame", id: editing.id, name: editing.name }, "Renamed")) setEditing(null); }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------- People ------------------------------ */

function PeopleTab({ state, act, busy, setConfirm }: TabProps) {
  const [team, setTeam] = useState<TeamId>("green");
  const [category, setCategory] = useState<string>("");
  const [text, setText] = useState("");
  const [view, setView] = useState<TeamId | "all">("all");
  const [q, setQ] = useState("");

  const names = text.split("\n").map((s) => s.trim()).filter(Boolean);
  const counts = useMemo(() => {
    const c: Record<string, number> = { green: 0, red: 0, blue: 0, yellow: 0 };
    for (const p of state.participants) c[p.team]++;
    return c;
  }, [state.participants]);
  const shown = state.participants.filter((p) => (view === "all" || p.team === view) && (!q || p.name.toLowerCase().includes(q.toLowerCase())));
  const t = teamById(team);

  return (
    <div>
      <section className="section">
        <div className="section-title"><h2>Add people</h2><small>{state.participants.length} total</small></div>
        <div className="card pad">
          <div className="field">
            <label>Team</label>
            <div className="pick-grid" style={{ gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
              {TEAMS.map((x) => (
                <button key={x.id} className="team-tab" aria-pressed={team === x.id} onClick={() => setTeam(x.id)} style={team === x.id ? { background: x.gradient, color: x.id === "yellow" ? "#3d2a00" : "#fff" } : undefined}>
                  <span className="sw" style={{ background: x.gradient }} />
                  {x.short} · {counts[x.id]}
                </button>
              ))}
            </div>
          </div>
          <div className="field" style={{ marginTop: 12 }}>
            <label htmlFor="cat">Category (optional)</label>
            <select id="cat" className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">— None —</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="field" style={{ marginTop: 12 }}>
            <label htmlFor="names">Names — one per line (paste from WhatsApp/Excel)</label>
            <textarea id="names" className="textarea" placeholder={"Ravi Kumar\nPriya Joseph\nSamuel David"} value={text} onChange={(e) => setText(e.target.value)} />
          </div>
          <button
            className="btn btn-block"
            style={{ marginTop: 12, background: t.gradient, color: t.id === "yellow" ? "#3d2a00" : "#fff", borderColor: "transparent" }}
            disabled={busy || !names.length}
            onClick={async () => {
              if (await act({ action: "addParticipants", team, category, names }, `${names.length} added to ${t.name}`)) setText("");
            }}
          >
            <Icon name="plus" /> Add {names.length || ""} to {t.name}
          </button>
        </div>
      </section>

      <section className="section">
        <div className="section-title"><h2>Everyone</h2><small>Move or remove people</small></div>
        <div className="seg" style={{ gridAutoColumns: "auto" }}>
          <button aria-pressed={view === "all"} onClick={() => setView("all")}>All</button>
          {TEAMS.map((x) => (
            <button key={x.id} aria-pressed={view === x.id} onClick={() => setView(x.id)}>
              <i className="dot" style={{ background: x.color }} />{counts[x.id]}
            </button>
          ))}
        </div>
        <input className="input" style={{ marginTop: 10 }} placeholder="Search a name…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div style={{ display: "grid", gap: 6, marginTop: 10 }}>
          {shown.map((p) => (
            <div key={p.id} className="person" style={{ borderLeft: `4px solid ${teamById(p.team).color}` }}>
              <span className="pn">{p.name}{p.category && <small>{p.category}</small>}</span>
              <select aria-label="Team" value={p.team} disabled={busy} onChange={(e) => act({ action: "updateParticipant", id: p.id, team: e.target.value }, `Moved to ${teamById(e.target.value).name}`)}>
                {TEAMS.map((x) => <option key={x.id} value={x.id}>{x.short}</option>)}
              </select>
              <button
                className="btn btn-ghost btn-icon btn-xs"
                aria-label={`Remove ${p.name}`}
                disabled={busy}
                onClick={() => setConfirm({ title: `Remove ${p.name}?`, body: "They will disappear from the team list.", cta: "Remove", danger: true, run: async () => { await act({ action: "deleteParticipant", id: p.id }, "Removed"); } })}
              >
                <Icon name="trash" />
              </button>
            </div>
          ))}
          {!shown.length && <div className="card empty"><b>No one here yet.</b></div>}
        </div>
      </section>
    </div>
  );
}

/* ------------------------------ Settings ----------------------------- */

function SettingsTab({ state, act, busy, setConfirm, onLogout }: TabProps & { onLogout: () => void }) {
  const [ann, setAnn] = useState(state.settings.announcement);
  const mode = state.settings.leaderboard_mode;
  return (
    <div>
      <section className="section">
        <div className="section-title"><h2>Leaderboard visibility</h2></div>
        <div className="card pad">
          <div className="seg">
            <button aria-pressed={mode === "auto"} disabled={busy} onClick={() => act({ action: "settings", leaderboard_mode: "auto" }, "Auto mode on")}>Auto</button>
            <button aria-pressed={mode === "open"} disabled={busy} onClick={() => act({ action: "settings", leaderboard_mode: "open" }, "Leaderboard opened")}>Open now</button>
            <button aria-pressed={mode === "closed"} disabled={busy} onClick={() => act({ action: "settings", leaderboard_mode: "closed" }, "Leaderboard hidden")}>Hide</button>
          </div>
          <p className="muted" style={{ margin: "10px 2px 0", fontSize: 13 }}>
            <b>Auto</b> unlocks on Sat 10 Oct at 8:00 AM. <b>Open now</b> shows teams, game names and scores immediately. <b>Hide</b> keeps it locked.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="section-title"><h2>Announcement banner</h2></div>
        <div className="card pad">
          <input className="input" maxLength={200} placeholder="e.g. Lunch is served at the dining hall 🍛" value={ann} onChange={(e) => setAnn(e.target.value)} />
          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn btn-ghost grow" disabled={busy || !state.settings.announcement} onClick={async () => { if (await act({ action: "settings", announcement: "" }, "Banner cleared")) setAnn(""); }}>Clear</button>
            <button className="btn btn-navy grow" disabled={busy} onClick={() => act({ action: "settings", announcement: ann }, "Banner updated")}><Icon name="megaphone" /> Publish</button>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-title"><h2>Backup</h2></div>
        <a className="btn btn-gold btn-block" href="/api/admin/export"><Icon name="download" /> Download CSV backup</a>
        <p className="muted" style={{ fontSize: 13, margin: "8px 2px 0" }}>Includes every score entry (even voided ones) and all participants.</p>
      </section>

      <section className="section">
        <div className="section-title"><h2>Cheers so far</h2></div>
        <div className="mini-totals">
          {TEAMS.map((t) => <div key={t.id} style={{ background: t.gradient, color: t.id === "yellow" ? "#3d2a00" : "#fff" }}><b>{state.cheers[t.id]}</b>{t.short}</div>)}
        </div>
      </section>

      <section className="section">
        <div className="section-title"><h2>After testing</h2></div>
        <div className="danger-zone">
          <p className="muted" style={{ marginTop: 0 }}>Use these to clear test data on Friday night. Scores are voided, not erased, so they stay in the CSV log.</p>
          <div className="row row-wrap">
            <button
              className="btn btn-danger btn-sm grow"
              disabled={busy}
              onClick={() => setConfirm({ title: "Reset all scores to zero?", body: "Every result is voided. Games stay in the list, ready to be scored again.", cta: "Reset scores", danger: true, typeWord: "RESET", run: async (w) => { await act({ action: "voidAll", confirm: w }, "All scores reset"); } })}
            >
              Reset all scores
            </button>
            <button
              className="btn btn-danger btn-sm grow"
              disabled={busy}
              onClick={() => setConfirm({ title: "Remove all people?", body: "Every participant is deleted from all four teams.", cta: "Remove everyone", danger: true, typeWord: "DELETE", run: async (w) => { await act({ action: "deleteAllParticipants", confirm: w }, "All participants removed"); } })}
            >
              Remove all people
            </button>
          </div>
        </div>
      </section>

      <section className="section">
        <button className="btn btn-ghost btn-block" onClick={onLogout}><Icon name="logout" /> Log out</button>
      </section>
    </div>
  );
}

/* ------------------------------- Modal ------------------------------- */

function ConfirmModal({ req, onClose }: { req: ConfirmReq; onClose: () => void }) {
  const [typed, setTyped] = useState("");
  const [working, setWorking] = useState(false);
  const ok = !req.typeWord || typed.trim().toUpperCase() === req.typeWord;
  return (
    <div className="modal-back" onClick={() => !working && onClose()}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h3>{req.title}</h3>
        <div className="muted">{req.body}</div>
        {req.typeWord && (
          <input className="input" style={{ marginTop: 12 }} placeholder={`Type ${req.typeWord} to confirm`} value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus />
        )}
        <div className="row" style={{ marginTop: 16 }}>
          <button className="btn btn-ghost grow" disabled={working} onClick={onClose}>Cancel</button>
          <button
            className={`btn grow ${req.danger ? "btn-danger" : "btn-primary"}`}
            disabled={!ok || working}
            onClick={async () => {
              setWorking(true);
              await req.run(typed.trim().toUpperCase());
              setWorking(false);
              onClose();
            }}
          >
            {working ? "Saving…" : req.cta}
          </button>
        </div>
      </div>
    </div>
  );
}
