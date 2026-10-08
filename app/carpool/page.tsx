import type { Metadata } from "next";
import Carpool from "@/components/Carpool";

export const metadata: Metadata = {
  title: "Carpool · CTC Oneness Family Retreat",
  description: "Who's picking up whom for the CTC Family Retreat on 10 Oct 2026.",
  robots: { index: false, follow: false },
};

export default function CarpoolPage() {
  return <Carpool />;
}
