"use client";

interface PublicProjectActionsProps {
  readonly publicSlug: string;
  readonly variant?: "share" | "copy-rpc" | "share-x" | "qr-code";
  readonly projectName?: string;
}

export function PublicProjectActions({
  publicSlug,
  variant = "share",
  projectName,
}: PublicProjectActionsProps) {
  const publicUrl = `https://www.fyxvo.com/p/${publicSlug}`;

  if (variant === "copy-rpc") {
    return (
      <button
        type="button"
        onClick={() => void navigator.clipboard.writeText("https://rpc.fyxvo.com/rpc")}
        className="shrink-0 rounded border border-[var(--fyxvo-border)] px-2 py-1 text-xs text-[var(--fyxvo-text-muted)] hover:bg-[var(--fyxvo-bg-elevated)] transition"
      >
        Copy
      </button>
    );
  }

  if (variant === "share-x") {
    const tweetText = encodeURIComponent(
      `I'm building on Solana with @fyxvo. Check out my project${projectName ? ` ${projectName}` : ""}: ${publicUrl}`
    );
    return (
      <a
        href={`https://x.com/intent/tweet?text=${tweetText}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 rounded-md border border-[var(--fyxvo-border)] bg-transparent px-3 py-1.5 text-xs text-[var(--fyxvo-text-muted)] hover:bg-[var(--fyxvo-panel-soft)] hover:text-[var(--fyxvo-text)] transition"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.856L1.254 2.25H8.08l4.259 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
        </svg>
        Share on X
      </a>
    );
  }

  if (variant === "qr-code") {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(publicUrl)}`;
    return (
      <a
        href={qrUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 rounded-md border border-[var(--fyxvo-border)] bg-transparent px-3 py-1.5 text-xs text-[var(--fyxvo-text-muted)] hover:bg-[var(--fyxvo-panel-soft)] hover:text-[var(--fyxvo-text)] transition"
      >
        QR Code &#8594;
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void navigator.clipboard.writeText(publicUrl)}
      className="flex items-center gap-1.5 rounded-md border border-[var(--fyxvo-border)] bg-transparent px-3 py-1.5 text-xs text-[var(--fyxvo-text-muted)] hover:bg-[var(--fyxvo-panel-soft)] hover:text-[var(--fyxvo-text)] transition"
    >
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="h-3.5 w-3.5"
        aria-hidden="true"
      >
        <circle cx="12" cy="3" r="1.5" />
        <circle cx="4" cy="8" r="1.5" />
        <circle cx="12" cy="13" r="1.5" />
        <path d="M5.5 7l5-3M5.5 9l5 3" />
      </svg>
      Share
    </button>
  );
}
