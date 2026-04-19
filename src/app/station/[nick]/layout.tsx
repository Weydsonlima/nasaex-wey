import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Space Station | NASA Agents",
  description: "Espaço virtual de networking e colaboração",
};

export default function SpaceStationLayout({ children }: { children: React.ReactNode }) {
  return <main className="w-full min-h-screen bg-slate-950">{children}</main>;
}
