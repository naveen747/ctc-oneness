import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildBoard } from "@/lib/board";

export const dynamic = "force-dynamic";

// Every visitor polls this endpoint. Vercel's CDN caches the response for a few
// seconds, so even hundreds of phones only cause ~1 database read every 3 seconds.
export async function GET() {
  try {
    const snap = await db().snapshot();
    const board = buildBoard(snap);
    return NextResponse.json(board, {
      headers: {
        "Cache-Control": "public, max-age=0, must-revalidate",
        "CDN-Cache-Control": "public, s-maxage=3, stale-while-revalidate=60",
        "Vercel-CDN-Cache-Control": "public, s-maxage=3, stale-while-revalidate=60",
      },
    });
  } catch (err) {
    console.error("board error", err);
    return NextResponse.json(
      { error: "Scores are temporarily unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
