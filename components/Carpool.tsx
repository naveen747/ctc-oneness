"use client";
import { useMemo, useState } from "react";
import { CARS, formatPhone, seatsIn, telHref } from "@/lib/carpool";
import { EVENT } from "@/lib/content";
import Icon from "./Icon";

const CAR_COLORS = ["#b3262f", "#1e6fd9", "#1f9d55", "#e8a800"];

/** Little side-view car with spinning wheels, driving on a scrolling road. */
function DrivingScene() {
  return (
    <div className="drive-scene" aria-hidden>
      <div className="drive-sun" />
      <div className="drive-hills" />
      <div className="drive-trees">
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i} style={{ left: `${i * 14}%` }}>🌴</span>
        ))}
      </div>
      <div className="drive-road"><i /></div>
      <svg className="drive-car" viewBox="0 0 120 56" width="120" height="56">
        <g className="car-body">
          <path d="M8 38c0-6 3-10 9-11l12-2 12-11c2-2 5-3 8-3h22c4 0 7 2 9 5l7 9 15 3c5 1 8 5 8 10v4H8v-4Z" fill="#8e1b24" />
          <path d="M44 25l9-9c1-1 3-2 5-2h10v11H44Z M72 14h7c2 0 4 1 5 3l5 8H72V14Z" fill="#cfe6fb" />
          <rect x="70" y="14" width="2.5" height="12" fill="#8e1b24" />
          <rect x="14" y="33" width="96" height="3" rx="1.5" fill="#c9a24b" />
          <circle cx="110" cy="34" r="2.6" fill="#ffe7a3" />
          <rect x="6" y="36" width="5" height="3" rx="1.5" fill="#ff6b6b" />
          <text x="60" y="47" textAnchor="middle" fontSize="7" fontWeight="800" fill="#fbe9c5" fontFamily="Manrope, sans-serif">CTC</text>
        </g>
        <g className="wheel" style={{ transformOrigin: "30px 44px" }}>
          <circle cx="30" cy="44" r="9" fill="#1b1b1f" />
          <circle cx="30" cy="44" r="4" fill="#d9d9de" />
          <path d="M30 37v14M23 44h14" stroke="#1b1b1f" strokeWidth="2" />
        </g>
        <g className="wheel" style={{ transformOrigin: "92px 44px" }}>
          <circle cx="92" cy="44" r="9" fill="#1b1b1f" />
          <circle cx="92" cy="44" r="4" fill="#d9d9de" />
          <path d="M92 37v14M85 44h14" stroke="#1b1b1f" strokeWidth="2" />
        </g>
      </svg>
      <div className="drive-puff" />
    </div>
  );
}

export default function Carpool() {
  const [q, setQ] = useState("");
  const totalRiders = CARS.reduce((a, c) => a + seatsIn(c), 0);

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    const digits = s.replace(/\D/g, "");
    if (!s) return CARS;
    return CARS.filter(
      (c) =>
        c.driver.toLowerCase().includes(s) ||
        (digits.length >= 3 && c.phone.includes(digits)) ||
        c.riders.some((r) => r.name.toLowerCase().includes(s) || (digits.length >= 3 && r.phone.includes(digits)))
    );
  }, [q]);

  return (
    <div className="shell" style={{ paddingBottom: 40 }}>
      <div className="topbar">
        <a className="btn btn-ghost btn-icon btn-xs" href="/?skipintro=1" aria-label="Back to home" style={{ width: 38, minHeight: 38 }}>
          <Icon name="arrow" style={{ transform: "rotate(180deg)" }} />
        </a>
        <div className="brand">
          <b>CARPOOL</b>
          <span>Rides to {EVENT.venue} · Sat 10 Oct</span>
        </div>
        <div className="spacer" />
        <img src="/logo.png" alt="" width={36} height={36} />
      </div>

      <section className="carpool-hero">
        <DrivingScene />
        <div className="carpool-hero-text">
          <div className="eyebrow">Ride together, arrive together</div>
          <h1>Find your ride 🚗</h1>
          <p className="muted" style={{ margin: 0 }}>
            Tap a number to call. Please plan to reach {EVENT.venue} by 8:00 AM.
          </p>
        </div>
      </section>

      <div className="stats" style={{ gridTemplateColumns: "repeat(3,1fr)", marginTop: 14 }}>
        <div className="stat"><b>{CARS.length}</b><span>Cars</span></div>
        <div className="stat"><b>{totalRiders}</b><span>Riders</span></div>
        <div className="stat"><b>{CARS.reduce((a, c) => a + c.riders.length, 0)}</b><span>Pickups</span></div>
      </div>

      <div className="carpool-search">
        <Icon name="users" />
        <input
          className="input"
          type="search"
          placeholder="Search your name, driver or number…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search carpool"
        />
      </div>

      <div className="car-list">
        {shown.map((c, i) => {
          const seats = seatsIn(c);
          const color = CAR_COLORS[i % CAR_COLORS.length];
          return (
            <article key={c.driver} className="car-card" style={{ ["--car" as string]: color, animationDelay: `${Math.min(i, 8) * 40}ms` }}>
              <header className="car-head">
                <span className="car-ic" aria-hidden>🚘</span>
                <div className="car-driver">
                  <span className="car-label">Car owner</span>
                  <b>{c.driver}</b>
                  <a className="phone-link" href={telHref(c.phone)}>📞 {formatPhone(c.phone)}</a>
                </div>
                <div className="car-count" title={`${seats} ${seats === 1 ? "person" : "people"} in this car`}>
                  <b>{seats}</b>
                  <span>{seats === 1 ? "rider" : "riders"}</span>
                </div>
              </header>
              <div className="seat-dots" aria-hidden>
                {Array.from({ length: seats }).map((_, k) => <i key={k} />)}
              </div>
              <ul className="riders">
                {c.riders.map((r) => (
                  <li key={`${r.name}-${r.count}`}>
                    <div className="rider-name">
                      <b>{r.name}</b>
                      <span>{r.count} {r.count === 1 ? "person" : "people"}{r.note ? ` · ${r.note}` : ""}</span>
                    </div>
                    <a className="btn btn-ghost btn-xs" href={telHref(r.phone)} aria-label={`Call ${r.name}`}>
                      📞 {formatPhone(r.phone)}
                    </a>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
        {!shown.length && (
          <div className="card empty">
            <div className="big">🔍</div>
            <b>No match for “{q}”.</b>
            <div className="muted">Try a shorter name, or contact a coordinator.</div>
          </div>
        )}
      </div>

      <a className="btn btn-navy btn-block" style={{ marginTop: 18 }} href={EVENT.mapsUrl} target="_blank" rel="noopener noreferrer">
        <Icon name="pin" /> Open location in Maps
      </a>
      <a className="btn btn-ghost btn-block" style={{ marginTop: 10 }} href="/?skipintro=1">
        Back to home
      </a>
    </div>
  );
}
