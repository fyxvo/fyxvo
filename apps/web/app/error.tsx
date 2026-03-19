"use client";

import { Button, Notice } from "@fyxvo/ui";

function getSafeMessage(error: Error & { digest?: string }) {
  if (process.env.NODE_ENV !== "production" && error.message) {
    return error.message;
  }

  return "The page could not finish loading. Refresh and try again. If the issue persists, check the public status page.";
}

export default function Error({
  error,
  reset
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  return (
    <div className="space-y-6">
      <Notice tone="danger" title="Something interrupted the page">
        {getSafeMessage(error)}
      </Notice>
      <Button onClick={() => reset()}>Try again</Button>
    </div>
  );
}
