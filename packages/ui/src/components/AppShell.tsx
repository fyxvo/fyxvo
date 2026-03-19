import type { PropsWithChildren, ReactNode } from "react";
import { Badge } from "./Badge";
import { cn } from "../lib/cn";

export function AppShell({
  title,
  description,
  aside,
  children,
  className
}: PropsWithChildren<{
  title: string;
  description: string;
  aside?: ReactNode;
  className?: string;
}>) {
  return (
    <main className={cn("mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-12", className)}>
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-brand-300">
            Production Foundation
          </p>
          <h1 className="font-display text-5xl font-semibold tracking-tight text-white">{title}</h1>
          <p className="mt-4 text-base leading-7 text-slate-400">{description}</p>
        </div>
        {aside}
      </header>
      {children}
    </main>
  );
}

export function StatusBadge({
  children,
  tone
}: PropsWithChildren<{
  tone: "ready" | "danger" | "neutral";
}>) {
  const badgeTone = tone === "ready" ? "success" : tone === "danger" ? "danger" : "neutral";
  return <Badge tone={badgeTone}>{children}</Badge>;
}
