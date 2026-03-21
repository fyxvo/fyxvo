import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support — Fyxvo",
  description: "Submit and track support tickets for your Fyxvo projects.",
};

export default function SupportLayout({ children }: { readonly children: React.ReactNode }) {
  return <>{children}</>;
}
