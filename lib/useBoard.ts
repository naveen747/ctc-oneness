"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Board } from "./types";

const CACHE_KEY = "ctc-board-v1";

function readCache(): Board | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as Board) : null;
  } catch {
    return null;
  }
}
function writeCache(b: Board) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(b));
  } catch {}
}

/**
 * Polls the cached /api/board endpoint. Keeps the last good data on screen if a
 * request fails, pauses while the tab is hidden, and speeds up near kick-off.
 */
export function useBoard() {
  const [board, setBoard] = useState<Board | null>(null);
  const [offset, setOffset] = useState(0); // server time - device time (ms), only if the phone clock is way off
  const [online, setOnline] = useState(true);
  const [lastOk, setLastOk] = useState<number | null>(null);
  const boardRef = useRef<Board | null>(null);
  const inflight = useRef(false);

  const load = useCallback(async () => {
    if (inflight.current) return;
    inflight.current = true;
    try {
      const res = await fetch("/api/board", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as Board;
      const raw = Date.parse(data.serverNow) - Date.now();
      // Responses can be a few seconds stale from the CDN, so only correct big clock errors.
      setOffset(Math.abs(raw) > 120_000 ? raw : 0);
      boardRef.current = data;
      setBoard(data);
      setOnline(true);
      setLastOk(Date.now());
      writeCache(data);
    } catch {
      setOnline(false);
    } finally {
      inflight.current = false;
    }
  }, []);

  useEffect(() => {
    const cached = readCache();
    if (cached) {
      boardRef.current = cached;
      setBoard(cached);
    }
    load();
  }, [load]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const b = boardRef.current;
      let ms = 30_000;
      if (b?.open) ms = 5_000;
      else if (b) {
        const left = Date.parse(b.start) - (Date.now() + offset);
        if (left < 3 * 60_000) ms = 3_000;
      }
      timer = setTimeout(async () => {
        if (document.visibilityState === "visible") await load();
        schedule();
      }, ms);
    };
    schedule();
    const onVis = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("online", load);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("online", load);
    };
  }, [load, offset]);

  return { board, offset, online, lastOk, reload: load };
}

export function useNow(offset: number, every = 1000) {
  const [now, setNow] = useState(() => Date.now() + offset);
  useEffect(() => {
    setNow(Date.now() + offset);
    const id = setInterval(() => setNow(Date.now() + offset), every);
    return () => clearInterval(id);
  }, [offset, every]);
  return now;
}
