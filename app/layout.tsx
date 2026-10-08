import type { Metadata, Viewport } from "next";
import "@fontsource/manrope/latin-500.css";
import "@fontsource/manrope/latin-600.css";
import "@fontsource/manrope/latin-700.css";
import "@fontsource/manrope/latin-800.css";
import "@fontsource/playfair-display/latin-600-italic.css";
import "@fontsource/playfair-display/latin-700.css";
import "@fontsource/playfair-display/latin-700-italic.css";
import "@fontsource/playfair-display/latin-800.css";
import "@fontsource/playfair-display/latin-900.css";
import "@fontsource/noto-serif-telugu/telugu-500.css";
import "./globals.css";

const title = "ONENESS · CTC Family Retreat 2026";
const description =
  "Christalaya Telugu Church Family Retreat — Saturday 10 Oct 2026 at Khedda Resorts, Kanakapura Road. Countdown, Do's & Don'ts and the live team leaderboard.";

export const metadata: Metadata = {
  metadataBase: process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? new URL(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`)
    : undefined,
  title,
  description,
  applicationName: "CTC Oneness",
  openGraph: { title, description, images: [{ url: "/og.jpg", width: 1200, height: 599 }], type: "website" },
  twitter: { card: "summary_large_image", title, description, images: ["/og.jpg"] },
  appleWebApp: { capable: true, title: "CTC Oneness", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#fbf6ec",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
