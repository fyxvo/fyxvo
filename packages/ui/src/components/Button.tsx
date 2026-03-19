import { cloneElement, isValidElement, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "../lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-500 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_14px_30px_rgba(249,115,22,0.25)] hover:bg-brand-400",
  secondary:
    "bg-[var(--fyxvo-panel-soft)] text-[var(--fyxvo-text)] ring-1 ring-inset ring-[var(--fyxvo-border)] hover:bg-[var(--fyxvo-panel)]",
  ghost:
    "bg-transparent text-[var(--fyxvo-text-muted)] hover:bg-[var(--fyxvo-panel-soft)] hover:text-[var(--fyxvo-text)]",
  danger:
    "bg-rose-500/90 text-white shadow-[0_14px_30px_rgba(244,63,94,0.25)] hover:bg-rose-400",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-base",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly loading?: boolean;
  readonly leadingIcon?: ReactNode;
  readonly trailingIcon?: ReactNode;
  readonly asChild?: boolean;
}

export function Button({
  className,
  children,
  variant = "primary",
  size = "md",
  loading = false,
  leadingIcon,
  trailingIcon,
  asChild = false,
  disabled,
  ...props
}: ButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-2xl text-center font-semibold leading-tight whitespace-normal transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--fyxvo-bg)] disabled:cursor-not-allowed disabled:opacity-60",
    variantClasses[variant],
    sizeClasses[size],
    className
  );

  if (asChild) {
    if (!isValidElement(children)) {
      return null;
    }

    const child = children as React.ReactElement<{ className?: string }>;

    return cloneElement(child, {
      className: cn(classes, child.props.className),
    });
  }

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {loading ? <Spinner /> : leadingIcon}
      <span>{children}</span>
      {!loading ? trailingIcon : null}
    </button>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
    />
  );
}
