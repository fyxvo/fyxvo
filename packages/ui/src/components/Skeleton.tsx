import { cn } from "../lib/cn";

export function Skeleton({
  className
}: {
  readonly className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-2xl bg-[linear-gradient(90deg,rgba(15,23,42,0.95),rgba(30,41,59,0.92),rgba(15,23,42,0.95))] bg-[length:200%_100%]",
        className
      )}
    />
  );
}
