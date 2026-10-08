import { NextResponse } from "next/server";
import { COOKIE, adminConfigured, makeToken, passwordMatches } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!adminConfigured())
    return NextResponse.json({ error: "Admin password is not set up on the server (ADMIN_PASSWORD)." }, { status: 500 });
  const body = await req.json().catch(() => ({}));
  const password = typeof body?.password === "string" ? body.password : "";
  if (!passwordMatches(password)) {
    await new Promise((r) => setTimeout(r, 800)); // slow down guessing
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }
  const { value, maxAge } = makeToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge,
  });
  return res;
}
