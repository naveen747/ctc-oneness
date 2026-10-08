"use client";
import { useEffect, useRef, useState } from "react";

function Cell({ value, unit }: { value: number; unit: string }) {
  const [k, setK] = useState(0);
  const prev = useRef(value);
  useEffect(() => {
    if (prev.current !== value) {
      prev.current = value;
      setK((x) => x + 1);
    }
  }, [value]);
  return (
    <div className="cd-cell">
      <span key={k} className={`cd-num${k ? " tick" : ""}`}>{String(value).padStart(2, "0")}</span>
      <span className="cd-unit">{unit}</span>
    </div>
  );
}

export default function Countdown({ now, target, label, when }: { now: number; target: number; label: string; when: string }) {
  const left = Math.max(0, target - now);
  const d = Math.floor(left / 86_400_000);
  const h = Math.floor((left % 86_400_000) / 3_600_000);
  const m = Math.floor((left % 3_600_000) / 60_000);
  const s = Math.floor((left % 60_000) / 1000);
  return (
    <div className="countdown" role="timer" aria-label={`${d} days ${h} hours ${m} minutes ${s} seconds to go`}>
      <div className="label">{left > 0 ? label : "It's time! Opening the leaderboard…"}</div>
      <div className="cd-grid">
        <Cell value={d} unit="Days" />
        <Cell value={h} unit="Hours" />
        <Cell value={m} unit="Mins" />
        <Cell value={s} unit="Secs" />
      </div>
      <div className="when">{when}</div>
    </div>
  );
}
