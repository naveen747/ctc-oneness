"use client";
import { useEffect, useState } from "react";
import { VERSES } from "@/lib/content";
import Icon from "./Icon";

export default function VerseCard() {
  const [i, setI] = useState(() => Math.floor(Math.random() * VERSES.length));
  useEffect(() => {
    const id = setInterval(() => setI((x) => (x + 1) % VERSES.length), 12_000);
    return () => clearInterval(id);
  }, []);
  const v = VERSES[i];
  return (
    <div className="card verse-card">
      <div className="eyebrow">Word for the day</div>
      <div key={i} className="fade-swap">
        <p className="q-en">“{v.en}”</p>
        <p className="q-te" lang="te">{v.te}</p>
        <div className="ref">{v.ref}</div>
      </div>
      <button className="btn btn-ghost btn-xs" style={{ marginTop: 14 }} onClick={() => setI((x) => (x + 1) % VERSES.length)}>
        <Icon name="refresh" /> Next verse
      </button>
    </div>
  );
}
