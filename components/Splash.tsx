"use client";
import { useEffect, useState } from "react";
import { VERSES } from "@/lib/content";

/** Full-screen loading screen with a random Bible verse (English + Telugu). */
export default function Splash({ ready, onDone }: { ready: boolean; onDone: () => void }) {
  const [verse] = useState(() => VERSES[Math.floor(Math.random() * VERSES.length)]);
  const [minDone, setMinDone] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const a = setTimeout(() => setMinDone(true), 3200);
    const b = setTimeout(() => setLeaving(true), 7000); // never block longer than this
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, []);

  useEffect(() => {
    if (minDone && ready) setLeaving(true);
  }, [minDone, ready]);

  useEffect(() => {
    if (!leaving) return;
    const t = setTimeout(onDone, 600);
    return () => clearTimeout(t);
  }, [leaving, onDone]);

  return (
    <div className={`splash${leaving ? " leaving" : ""}`} onClick={() => setLeaving(true)} role="dialog" aria-label="Welcome">
      <div className="rays" aria-hidden />
      <div className="splash-inner">
        <img className="splash-logo" src="/logo.png" alt="Christalaya Telugu Church" width={112} height={112} />
        <p className="verse-en">“{verse.en}”</p>
        <p className="verse-te" lang="te">“{verse.te}”</p>
        <div className="verse-ref">
          {verse.ref} · <span lang="te">{verse.refTe}</span>
        </div>
      </div>
      <div className="splash-foot">
        TAP TO ENTER
        <div className="splash-bar"><i /></div>
      </div>
    </div>
  );
}
