import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { teamById } from "@/lib/teams";

export const dynamic = "force-dynamic";

const csv = (v: unknown) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const ist = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "";

export async function GET() {
  if (!(await isAdmin())) return new Response("Not logged in", { status: 401 });
  const s = await db().snapshot({ includeVoided: true });
  const lines: string[] = [];
  lines.push("SCORE LOG");
  lines.push(["Entry ID", "Game", "Team", "Points", "Status", "Added (IST)", "Voided (IST)"].join(","));
  for (const e of s.entries) {
    const game = s.games.find((g) => g.id === e.game_id)?.name ?? `Game ${e.game_id}`;
    lines.push(
      [e.id, game, teamById(e.team).name, e.points, e.voided ? "VOIDED" : "active", ist(e.created_at), ist(e.voided_at)]
        .map(csv)
        .join(",")
    );
  }
  lines.push("");
  lines.push("PARTICIPANTS");
  lines.push(["Name", "Team", "Category"].join(","));
  for (const p of s.participants) lines.push([p.name, teamById(p.team).name, p.category ?? ""].map(csv).join(","));

  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
  return new Response("﻿" + lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ctc-oneness-backup-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
