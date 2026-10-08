import type { TeamId } from "./teams";

export type TeamTotals = Record<TeamId, number>;

export interface ResultItem {
  gameId: number;
  name: string;
  at: string;
  winners: TeamId[];
  runners: TeamId[];
}

export interface TimelinePoint {
  label: string;
  name: string;
  totals: TeamTotals;
}

export interface PublicMember {
  name: string;
  category: string | null;
}

export interface Board {
  serverNow: string;
  start: string;
  open: boolean;
  announcement: string;
  cheers: TeamTotals;
  totals?: TeamTotals;
  wins?: TeamTotals;
  results?: ResultItem[]; // newest first
  timeline?: TimelinePoint[]; // oldest first, starts with a zero point
  members?: Record<TeamId, PublicMember[]>;
}
