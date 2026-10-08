export type TeamId = "green" | "red" | "blue" | "yellow";

export interface Team {
  id: TeamId;
  name: string;
  short: string;
  emoji: string;
  color: string; // main colour
  deep: string; // darker shade for text on light bg
  soft: string; // tinted background
  gradient: string;
}

export const TEAMS: Team[] = [
  {
    id: "green",
    name: "Grace Guardians",
    short: "Grace",
    emoji: "🟢",
    color: "#1F9D55",
    deep: "#0F6B38",
    soft: "#E6F6EC",
    gradient: "linear-gradient(135deg,#2DBE6C 0%,#14804A 100%)",
  },
  {
    id: "red",
    name: "Love Legends",
    short: "Love",
    emoji: "🔴",
    color: "#D7263D",
    deep: "#9B1426",
    soft: "#FDE8EB",
    gradient: "linear-gradient(135deg,#F0475B 0%,#A8142A 100%)",
  },
  {
    id: "blue",
    name: "Faith Force",
    short: "Faith",
    emoji: "🔵",
    color: "#1E6FD9",
    deep: "#124A9A",
    soft: "#E6F0FD",
    gradient: "linear-gradient(135deg,#3C8BF0 0%,#1A4FA8 100%)",
  },
  {
    id: "yellow",
    name: "Hope Heroes",
    short: "Hope",
    emoji: "🟡",
    color: "#E8A800",
    deep: "#8A6200",
    soft: "#FFF6DA",
    gradient: "linear-gradient(135deg,#FFC93C 0%,#E09400 100%)",
  },
];

export const TEAM_IDS: TeamId[] = TEAMS.map((t) => t.id);

export const teamById = (id: string): Team =>
  TEAMS.find((t) => t.id === id) ?? TEAMS[0];

export const isTeamId = (v: unknown): v is TeamId =>
  typeof v === "string" && (TEAM_IDS as string[]).includes(v);

export const CATEGORIES = ["Kids", "Junior Kids", "Youth", "Gents", "Ladies"] as const;

export const WIN_POINTS = 10;
export const RUNNER_POINTS = 5;
