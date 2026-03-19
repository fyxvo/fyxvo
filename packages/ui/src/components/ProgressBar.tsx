import { cn } from "../lib/cn";

export function ProgressBar({
  value,
  label,
  className
}: {
  readonly value: number;
  readonly label?: string;
  readonly className?: string;
}) {
  const normalized = Math.max(0, Math.min(100, value));

  return (
    <div className={cn("space-y-2", className)}>
      {label ? <div className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</div> : null}
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-900">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-400 via-brand-500 to-sky-400 transition-[width] duration-300"
          style={{ width: `${normalized}%` }}
        />
      </div>
    </div>
  );
}
