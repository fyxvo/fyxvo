import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "../lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly label?: string;
  readonly hint?: string;
  readonly error?: string;
  readonly leadingAdornment?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, hint, error, leadingAdornment, id, ...props },
  ref
) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <label className="flex w-full flex-col gap-2 text-sm">
      {label ? <span className="font-medium text-slate-200">{label}</span> : null}
      <span
        className={cn(
          "flex items-center gap-3 rounded-2xl border bg-slate-950/80 px-4 transition focus-within:ring-2 focus-within:ring-brand-400 focus-within:ring-offset-2 focus-within:ring-offset-slate-950",
          error ? "border-rose-500/70" : "border-slate-800"
        )}
      >
        {leadingAdornment ? (
          <span className="text-slate-500" aria-hidden="true">
            {leadingAdornment}
          </span>
        ) : null}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            "h-12 w-full border-none bg-transparent p-0 text-slate-100 outline-none placeholder:text-slate-600",
            className
          )}
          {...props}
        />
      </span>
      {error ? (
        <span className="text-sm text-rose-400">{error}</span>
      ) : hint ? (
        <span className="text-sm text-slate-500">{hint}</span>
      ) : null}
    </label>
  );
});
