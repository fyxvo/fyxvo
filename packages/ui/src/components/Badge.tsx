import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

type BadgeTone = "brand" | "success" | "warning" | "danger" | "neutral";

const toneClasses: Record<BadgeTone, string> = {
  brand: "bg-brand-500/15 text-brand-400 ring-brand-500/20",
  success: "bg-emerald-500/15 text-emerald-600 ring-emerald-500/20 dark:text-emerald-300",
  warning: "bg-amber-500/15 text-amber-600 ring-amber-500/20 dark:text-amber-300",
  danger: "bg-rose-500/15 text-rose-600 ring-rose-500/20 dark:text-rose-300",
  neutral: "bg-[var(--fyxvo-panel-soft)] text-[var(--fyxvo-text-soft)] ring-[var(--fyxvo-border)]",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  readonly tone?: BadgeTone;
}

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ring-1 ring-inset",
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}
