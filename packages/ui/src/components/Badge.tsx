import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

type BadgeTone = "brand" | "success" | "warning" | "danger" | "neutral";

const toneClasses: Record<BadgeTone, string> = {
  brand: "bg-brand-500/15 text-brand-300 ring-brand-500/20",
  success: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/20",
  warning: "bg-amber-500/15 text-amber-300 ring-amber-500/20",
  danger: "bg-rose-500/15 text-rose-300 ring-rose-500/20",
  neutral: "bg-slate-800 text-slate-300 ring-slate-700"
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
