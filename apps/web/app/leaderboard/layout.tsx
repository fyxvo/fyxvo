import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Leaderboard — Fyxvo",
  description: "Top Fyxvo projects by request volume over the last 30 days.",
};
export default function Layout({ children }: { readonly children: React.ReactNode }) {
  return <>{children}</>;
}
