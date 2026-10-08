"use client";
import { useState } from "react";
import { CATEGORIES, TEAMS, type TeamId } from "@/lib/teams";
import { DONTS, DOS, type Rule } from "@/lib/content";
import type { PublicMember } from "@/lib/types";
import Icon from "./Icon";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

export function TeamsView({ members, open }: { members?: Record<TeamId, PublicMember[]>; open: boolean }) {
  const [sel, setSel] = useState<TeamId>("green");
  const team = TEAMS.find((t) => t.id === sel)!;
  const list = members?.[sel] ?? [];

  if (!open) {
    return (
      <section className="section">
        <div className="section-title"><h2>The four teams</h2></div>
        <div className="card pad" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40 }}>🎟️</div>
          <h3 style={{ fontFamily: "var(--display)", margin: "6px 0 4px", fontSize: 21 }}>Teams are picked by lottery</h3>
          <p className="muted" style={{ margin: 0 }}>
            Kids, junior kids, youth, gents and ladies will be split equally into four teams on the morning of the event.
            Check back here on Saturday to see who's on which team!
          </p>
        </div>
        <div className="team-grid" style={{ marginTop: 12 }}>
          {TEAMS.map((t) => (
            <div key={t.id} className={`team-card ${t.id}`} style={{ background: t.gradient, cursor: "default" }}>
              <span style={{ fontSize: 22, position: "relative", zIndex: 1 }}>{t.emoji}</span>
              <span className="tc-name">{t.name}</span>
            </div>
          ))}
        </div>
      </section>
    );
  }

  const groups: { cat: string; people: PublicMember[] }[] = [];
  const known = new Set<string>(CATEGORIES);
  for (const c of CATEGORIES) {
    const people = list.filter((p) => p.category === c);
    if (people.length) groups.push({ cat: c, people });
  }
  const others = list.filter((p) => !p.category || !known.has(p.category));
  if (others.length) groups.push({ cat: groups.length ? "Members" : "Team members", people: others });

  return (
    <section className="section">
      <div className="section-title"><h2>Teams</h2><small>{Object.values(members ?? {}).reduce((a, b) => a + b.length, 0)} participants</small></div>
      <div className="team-tabs" role="tablist">
        {TEAMS.map((t) => (
          <button
            key={t.id}
            className="team-tab"
            aria-pressed={sel === t.id}
            onClick={() => setSel(t.id)}
            style={sel === t.id ? { background: t.gradient, color: t.id === "yellow" ? "#3d2a00" : "#fff", borderColor: "transparent" } : undefined}
          >
            <span className="sw" style={{ background: t.gradient, boxShadow: sel === t.id ? "0 0 0 2px rgba(255,255,255,.8)" : undefined }} />
            {t.short}
          </button>
        ))}
      </div>
      <div className={`roster-head ${team.id}`} style={{ background: team.gradient }}>
        <h3>{team.name}</h3>
        <div className="count"><b>{list.length}</b>members</div>
      </div>
      {list.length === 0 ? (
        <div className="card empty" style={{ marginTop: 12 }}>
          <div className="big">⏳</div>
          <b>Team list coming up after the lottery.</b>
        </div>
      ) : (
        groups.map((g) => (
          <div key={g.cat} className="cat-block">
            <div className="cat-title"><span>{g.cat}</span><span>{g.people.length}</span></div>
            <div className="names">
              {g.people.map((p, i) => (
                <div key={`${p.name}-${i}`} className="name-chip">
                  <span className="av" style={{ background: team.gradient, color: team.id === "yellow" ? "#3d2a00" : "#fff" }}>{initials(p.name)}</span>
                  <span>{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </section>
  );
}

function RuleList({ rules, kind }: { rules: Rule[]; kind: "do" | "dont" }) {
  return (
    <div className={`card ${kind}`} style={{ marginTop: 12 }}>
      {rules.map((r, i) => (
        <div key={r.title} className="rule">
          <div className="rule-ic">
            <span className="n">{i + 1}</span>
            <Icon name={r.icon} />
          </div>
          <div>
            <h4>{r.title}</h4>
            <p>{r.body}</p>
            {r.bullets && (
              <ul>
                {r.bullets.map((b) => <li key={b}>{b}</li>)}
              </ul>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function RulesView() {
  const [tab, setTab] = useState<"do" | "dont">("do");
  return (
    <section className="section">
      <div className="section-title"><h2>Do's &amp; Don'ts</h2><small>Khedda Resorts</small></div>
      <div className="seg">
        <button aria-pressed={tab === "do"} onClick={() => setTab("do")}>
          <Icon name="check" width={16} height={16} style={{ color: "#1d7a34" }} /> Do's ({DOS.length})
        </button>
        <button aria-pressed={tab === "dont"} onClick={() => setTab("dont")}>
          <Icon name="x" width={16} height={16} style={{ color: "#b3262f" }} /> Don'ts ({DONTS.length})
        </button>
      </div>
      <div key={tab} className="fade-swap">
        <div className={`rules-banner ${tab}`} style={{ marginTop: 12 }}>
          <Icon name={tab === "do" ? "check" : "x"} width={22} height={22} />
          {tab === "do" ? "Please do these" : "Please avoid these"}
        </div>
        <RuleList rules={tab === "do" ? DOS : DONTS} kind={tab} />
      </div>
      <div className="motto">Let's Participate · Enjoy · Encourage · Create Great Memories!</div>
    </section>
  );
}
