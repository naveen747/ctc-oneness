import "server-only";
import { createHmac, createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const COOKIE = "ctc_admin";
const MAX_AGE = 60 * 60 * 24 * 3; // 3 days

function secret(): string {
  const pw = process.env.ADMIN_PASSWORD ?? "";
  const extra = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "local-preview";
  return createHash("sha256").update(`${pw}::${extra}::ctc-oneness`).digest("hex");
}

export function adminConfigured(): boolean {
  return (process.env.ADMIN_PASSWORD ?? "").length >= 6 || process.env.NODE_ENV !== "production";
}

export function passwordMatches(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? (process.env.NODE_ENV !== "production" ? "admin123" : "");
  if (!expected) return false;
  const a = createHash("sha256").update(input).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export function makeToken(): { value: string; maxAge: number } {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  const sig = createHmac("sha256", secret()).update(String(exp)).digest("hex");
  return { value: `${exp}.${sig}`, maxAge: MAX_AGE };
}

export function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const [expStr, sig] = token.split(".");
  const exp = Number(expStr);
  if (!exp || !sig || exp * 1000 < Date.now()) return false;
  const good = createHmac("sha256", secret()).update(String(exp)).digest("hex");
  if (good.length !== sig.length) return false;
  return timingSafeEqual(Buffer.from(good), Buffer.from(sig));
}

export async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  return verifyToken(jar.get(COOKIE)?.value);
}
