import "server-only";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { TeamId } from "./teams";

export type LeaderboardMode = "auto" | "open" | "closed";

export interface Settings {
  announcement: string;
  leaderboard_mode: LeaderboardMode;
  updated_at: string;
}
export interface Participant {
  id: number;
  name: string;
  team: TeamId;
  category: string | null;
  created_at: string;
}
export interface Game {
  id: number;
  name: string;
  sort_order: number;
  created_at: string;
}
export interface ScoreEntry {
  id: number;
  game_id: number;
  team: TeamId;
  points: number;
  voided: boolean;
  voided_at: string | null;
  created_at: string;
}
export type Cheers = Record<TeamId, number>;

export interface Snapshot {
  settings: Settings;
  participants: Participant[];
  games: Game[];
  entries: ScoreEntry[];
  cheers: Cheers;
}

export class UserError extends Error {}

interface Store {
  snapshot(opts?: { includeVoided?: boolean }): Promise<Snapshot>;
  cheersOnly(): Promise<{ settings: Settings; cheers: Cheers }>;
  updateSettings(patch: Partial<Pick<Settings, "announcement" | "leaderboard_mode">>): Promise<void>;
  addParticipants(rows: { name: string; team: TeamId; category: string | null }[]): Promise<number>;
  updateParticipant(id: number, patch: Partial<Pick<Participant, "name" | "team" | "category">>): Promise<void>;
  deleteParticipant(id: number): Promise<void>;
  deleteAllParticipants(): Promise<void>;
  addGames(names: string[]): Promise<void>;
  updateGame(id: number, patch: Partial<Pick<Game, "name" | "sort_order">>): Promise<void>;
  deleteGame(id: number): Promise<void>;
  scoreGame(gameId: number, rows: { team: TeamId; points: number }[]): Promise<void>;
  voidGame(gameId: number): Promise<void>;
  voidAll(): Promise<void>;
  cheer(team: TeamId, prev: TeamId | null): Promise<void>;
}

const emptyCheers = (): Cheers => ({ green: 0, red: 0, blue: 0, yellow: 0 });

/* ------------------------------------------------------------------ */
/* Supabase (production)                                               */
/* ------------------------------------------------------------------ */

class SupabaseStore implements Store {
  constructor(private sb: SupabaseClient) {}

  private check<T>(res: { data: T; error: { message: string; code?: string } | null }): T {
    if (res.error) {
      if (res.error.code === "23505") throw new UserError("Points for this game were already added. Void the result first to re-score it.");
      throw new Error(res.error.message);
    }
    return res.data;
  }

  private async settings(): Promise<Settings> {
    const s = this.check(
      await this.sb.from("settings").select("announcement,leaderboard_mode,updated_at").eq("id", 1).single()
    );
    return s as Settings;
  }

  private async cheers(): Promise<Cheers> {
    const rows = this.check(await this.sb.from("cheers").select("team,count")) as { team: TeamId; count: number }[];
    const c = emptyCheers();
    for (const r of rows) c[r.team] = Number(r.count);
    return c;
  }

  async snapshot(opts?: { includeVoided?: boolean }): Promise<Snapshot> {
    let entriesQ = this.sb.from("score_entries").select("*").order("created_at").limit(5000);
    if (!opts?.includeVoided) entriesQ = entriesQ.eq("voided", false);
    const [settings, participants, games, entries, cheers] = await Promise.all([
      this.settings(),
      this.sb.from("participants").select("*").order("name").limit(1000).then((r) => this.check(r)),
      this.sb.from("games").select("*").order("sort_order").order("id").limit(500).then((r) => this.check(r)),
      entriesQ.then((r) => this.check(r)),
      this.cheers(),
    ]);
    return {
      settings,
      participants: participants as Participant[],
      games: games as Game[],
      entries: entries as ScoreEntry[],
      cheers,
    };
  }

  async cheersOnly() {
    const [settings, cheers] = await Promise.all([this.settings(), this.cheers()]);
    return { settings, cheers };
  }

  async updateSettings(patch: Partial<Pick<Settings, "announcement" | "leaderboard_mode">>) {
    this.check(await this.sb.from("settings").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", 1));
  }

  async addParticipants(rows: { name: string; team: TeamId; category: string | null }[]) {
    if (!rows.length) return 0;
    this.check(await this.sb.from("participants").insert(rows));
    return rows.length;
  }
  async updateParticipant(id: number, patch: Partial<Pick<Participant, "name" | "team" | "category">>) {
    this.check(await this.sb.from("participants").update(patch).eq("id", id));
  }
  async deleteParticipant(id: number) {
    this.check(await this.sb.from("participants").delete().eq("id", id));
  }
  async deleteAllParticipants() {
    this.check(await this.sb.from("participants").delete().gt("id", 0));
  }

  async addGames(names: string[]) {
    const { data } = await this.sb.from("games").select("sort_order").order("sort_order", { ascending: false }).limit(1);
    let next = (data?.[0]?.sort_order ?? 0) + 1;
    this.check(await this.sb.from("games").insert(names.map((name) => ({ name, sort_order: next++ }))));
  }
  async updateGame(id: number, patch: Partial<Pick<Game, "name" | "sort_order">>) {
    this.check(await this.sb.from("games").update(patch).eq("id", id));
  }
  async deleteGame(id: number) {
    const active = this.check(
      await this.sb.from("score_entries").select("id").eq("game_id", id).eq("voided", false).limit(1)
    ) as unknown[];
    if (active.length) throw new UserError("This game has points. Void its result before deleting it.");
    this.check(await this.sb.from("score_entries").delete().eq("game_id", id).eq("voided", true));
    this.check(await this.sb.from("games").delete().eq("id", id));
  }

  async scoreGame(gameId: number, rows: { team: TeamId; points: number }[]) {
    const active = this.check(
      await this.sb.from("score_entries").select("id").eq("game_id", gameId).eq("voided", false).limit(1)
    ) as unknown[];
    if (active.length) throw new UserError("Points for this game were already added. Void the result first to re-score it.");
    this.check(await this.sb.from("score_entries").insert(rows.map((r) => ({ ...r, game_id: gameId }))));
  }
  async voidGame(gameId: number) {
    this.check(
      await this.sb.from("score_entries").update({ voided: true, voided_at: new Date().toISOString() }).eq("game_id", gameId).eq("voided", false)
    );
  }
  async voidAll() {
    this.check(
      await this.sb.from("score_entries").update({ voided: true, voided_at: new Date().toISOString() }).eq("voided", false)
    );
  }

  async cheer(team: TeamId, prev: TeamId | null) {
    this.check(await this.sb.rpc("cheer", { p_new: team, p_old: prev }));
  }
}

/* ------------------------------------------------------------------ */
/* In-memory store — local preview only, never used in production      */
/* ------------------------------------------------------------------ */

class MemoryStore implements Store {
  s: Snapshot = {
    settings: { announcement: "", leaderboard_mode: "auto", updated_at: new Date().toISOString() },
    participants: [],
    games: [],
    entries: [],
    cheers: emptyCheers(),
  };
  seq = 1;
  now = () => new Date().toISOString();

  async snapshot(opts?: { includeVoided?: boolean }) {
    const c = structuredClone(this.s);
    if (!opts?.includeVoided) c.entries = c.entries.filter((e) => !e.voided);
    c.participants.sort((a, b) => a.name.localeCompare(b.name));
    c.games.sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
    return c;
  }
  async cheersOnly() {
    return { settings: { ...this.s.settings }, cheers: { ...this.s.cheers } };
  }
  async updateSettings(patch: Partial<Pick<Settings, "announcement" | "leaderboard_mode">>) {
    Object.assign(this.s.settings, patch, { updated_at: this.now() });
  }
  async addParticipants(rows: { name: string; team: TeamId; category: string | null }[]) {
    for (const r of rows) this.s.participants.push({ ...r, id: this.seq++, created_at: this.now() });
    return rows.length;
  }
  async updateParticipant(id: number, patch: Partial<Pick<Participant, "name" | "team" | "category">>) {
    const p = this.s.participants.find((x) => x.id === id);
    if (p) Object.assign(p, patch);
  }
  async deleteParticipant(id: number) {
    this.s.participants = this.s.participants.filter((x) => x.id !== id);
  }
  async deleteAllParticipants() {
    this.s.participants = [];
  }
  async addGames(names: string[]) {
    let next = Math.max(0, ...this.s.games.map((g) => g.sort_order)) + 1;
    for (const name of names) this.s.games.push({ id: this.seq++, name, sort_order: next++, created_at: this.now() });
  }
  async updateGame(id: number, patch: Partial<Pick<Game, "name" | "sort_order">>) {
    const g = this.s.games.find((x) => x.id === id);
    if (g) Object.assign(g, patch);
  }
  async deleteGame(id: number) {
    if (this.s.entries.some((e) => e.game_id === id && !e.voided))
      throw new UserError("This game has points. Void its result before deleting it.");
    this.s.entries = this.s.entries.filter((e) => e.game_id !== id);
    this.s.games = this.s.games.filter((g) => g.id !== id);
  }
  async scoreGame(gameId: number, rows: { team: TeamId; points: number }[]) {
    if (this.s.entries.some((e) => e.game_id === gameId && !e.voided))
      throw new UserError("Points for this game were already added. Void the result first to re-score it.");
    for (const r of rows)
      this.s.entries.push({ id: this.seq++, game_id: gameId, team: r.team, points: r.points, voided: false, voided_at: null, created_at: this.now() });
  }
  async voidGame(gameId: number) {
    for (const e of this.s.entries) if (e.game_id === gameId && !e.voided) Object.assign(e, { voided: true, voided_at: this.now() });
  }
  async voidAll() {
    for (const e of this.s.entries) if (!e.voided) Object.assign(e, { voided: true, voided_at: this.now() });
  }
  async cheer(team: TeamId, prev: TeamId | null) {
    this.s.cheers[team]++;
    if (prev && prev !== team) this.s.cheers[prev] = Math.max(0, this.s.cheers[prev] - 1);
  }
}

/* ------------------------------------------------------------------ */

const g = globalThis as unknown as { __ctcStore?: Store };

export function db(): Store {
  if (g.__ctcStore) return g.__ctcStore;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) {
    g.__ctcStore = new SupabaseStore(
      createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
    );
  } else if (process.env.DEMO_MODE === "1" || process.env.NODE_ENV !== "production") {
    g.__ctcStore = new MemoryStore();
  } else {
    throw new Error("Database is not configured: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }
  return g.__ctcStore;
}
