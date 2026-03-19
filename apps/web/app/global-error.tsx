"use client";

import { Button, Notice } from "@fyxvo/ui";
import { BrandLogo } from "../components/brand-logo";

function getSafeMessage(error: Error & { digest?: string }) {
  if (process.env.NODE_ENV !== "production" && error.message) {
    return error.message;
  }

  return "The shell hit an unexpected problem. Reload the application or review the live status surface before retrying.";
}

export default function GlobalError({
  error,
  reset
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="fyxvo-theme text-[var(--fyxvo-text)]">
        <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6">
          <div className="w-full space-y-6">
            <BrandLogo />
            <Notice tone="danger" title="The application shell crashed">
              {getSafeMessage(error)}
            </Notice>
            <Button onClick={() => reset()}>Reload application</Button>
          </div>
        </main>
      </body>
    </html>
  );
}
