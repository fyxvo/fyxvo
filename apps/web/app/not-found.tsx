import Link from "next/link";
import { Button } from "@fyxvo/ui";
import { BrandLogo } from "../components/brand-logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-8">
        <BrandLogo />
      </div>
      <div className="mb-6 text-6xl font-bold tabular-nums text-[var(--fyxvo-text-muted)]">404</div>
      <h1 className="text-2xl font-semibold text-[var(--fyxvo-text)]">Page not found</h1>
      <p className="mt-3 max-w-sm text-sm leading-6 text-[var(--fyxvo-text-soft)]">
        This route doesn&apos;t exist in the Fyxvo workspace. Check the URL or navigate back to a
        known section.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild variant="secondary">
          <Link href="/">Go home</Link>
        </Button>
        <Button asChild>
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/docs">View docs</Link>
        </Button>
      </div>
    </div>
  );
}
