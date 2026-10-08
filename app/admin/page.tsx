import type { Metadata } from "next";
import AdminApp from "@/components/AdminApp";

export const metadata: Metadata = { title: "Admin · CTC Oneness", robots: { index: false, follow: false } };

export default function AdminPage() {
  return <AdminApp />;
}
