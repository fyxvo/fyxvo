import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";

type NoticeTone = "brand" | "success" | "warning" | "danger" | "neutral";

const noticeToneClasses: Record<NoticeTone, string> = {
  brand: "border-brand-500/25 bg-brand-500/10 text-brand-600 dark:text-brand-200",
  success: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-100",
  warning: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-100",
  danger: "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-100",
  neutral:
    "border-[var(--fyxvo-border)] bg-[var(--fyxvo-panel-soft)] text-[var(--fyxvo-text-soft)]",
};

const noticeTitleClasses: Record<NoticeTone, string> = {
  brand: "text-brand-700 dark:text-brand-100",
  success: "text-emerald-800 dark:text-emerald-50",
  warning: "text-amber-800 dark:text-amber-50",
  danger: "text-rose-800 dark:text-rose-50",
  neutral: "text-[var(--fyxvo-text)]",
};

export interface NoticeProps extends HTMLAttributes<HTMLDivElement> {
  readonly title?: string;
  readonly tone?: NoticeTone;
  readonly icon?: ReactNode;
}

export function Notice({
  title,
  tone = "neutral",
  icon,
  className,
  children,
  ...props
}: NoticeProps) {
  return (
    <div
      className={cn(
        "rounded-3xl border p-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)]",
        noticeToneClasses[tone],
        className
      )}
      {...props}
    >
      <div className="flex items-start gap-3">
        {icon ? (
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-black/10">
            {icon}
          </div>
        ) : null}
        <div className="min-w-0 break-words space-y-1">
          {title ? (
            <p className={cn("font-semibold", noticeTitleClasses[tone])}>{title}</p>
          ) : null}
          <div className="text-sm leading-6 text-current">{children}</div>
        </div>
      </div>
    </div>
  );
}
