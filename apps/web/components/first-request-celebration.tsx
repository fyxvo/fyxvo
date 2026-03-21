"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import type { PortalProject } from "../lib/types";

interface Props {
  project: PortalProject;
  onDismiss: () => void;
}

export function FirstRequestCelebration({ project, onDismiss }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onDismiss();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onDismiss]);

  // Trap focus inside modal on open
  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  const publicPageHref = project.publicSlug ? `/p/${project.publicSlug}` : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="frc-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onDismiss}
        aria-hidden="true"
      />

      {/* Card */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative z-10 w-full max-w-md rounded-2xl border border-[var(--fyxvo-border)] bg-[var(--fyxvo-bg-elevated)] p-6 shadow-2xl focus:outline-none"
      >
        <div className="mb-1 text-3xl" aria-hidden="true">
          🎉
        </div>
        <h2
          id="frc-title"
          className="text-xl font-semibold text-[var(--fyxvo-text)]"
        >
          Your first request is live!
        </h2>
        <p className="mt-2 text-sm text-[var(--fyxvo-text-muted)]">
          Project{" "}
          <span className="font-medium text-[var(--fyxvo-text)]">
            {project.name}
          </span>{" "}
          just processed its first request. The relay is working — here&apos;s
          what to do next.
        </p>

        <ul className="mt-5 space-y-3">
          <li>
            <Link
              href="/analytics"
              className="flex items-center gap-3 rounded-xl border border-[var(--fyxvo-border)] bg-[var(--fyxvo-panel-soft)] px-4 py-3 text-sm font-medium text-[var(--fyxvo-text)] transition-colors hover:border-[var(--fyxvo-brand)] hover:text-[var(--fyxvo-brand)]"
              onClick={onDismiss}
            >
              <span className="text-lg" aria-hidden="true">
                📊
              </span>
              Explore Analytics
            </Link>
          </li>
          <li>
            <Link
              href="/settings#team"
              className="flex items-center gap-3 rounded-xl border border-[var(--fyxvo-border)] bg-[var(--fyxvo-panel-soft)] px-4 py-3 text-sm font-medium text-[var(--fyxvo-text)] transition-colors hover:border-[var(--fyxvo-brand)] hover:text-[var(--fyxvo-brand)]"
              onClick={onDismiss}
            >
              <span className="text-lg" aria-hidden="true">
                👥
              </span>
              Invite a Teammate
            </Link>
          </li>
          {publicPageHref ? (
            <li>
              <Link
                href={publicPageHref}
                className="flex items-center gap-3 rounded-xl border border-[var(--fyxvo-border)] bg-[var(--fyxvo-panel-soft)] px-4 py-3 text-sm font-medium text-[var(--fyxvo-text)] transition-colors hover:border-[var(--fyxvo-brand)] hover:text-[var(--fyxvo-brand)]"
                onClick={onDismiss}
              >
                <span className="text-lg" aria-hidden="true">
                  🌐
                </span>
                Share Your Project
              </Link>
            </li>
          ) : null}
        </ul>

        <button
          type="button"
          onClick={onDismiss}
          className="mt-6 w-full rounded-xl border border-[var(--fyxvo-border)] bg-[var(--fyxvo-panel-soft)] px-4 py-2.5 text-sm font-medium text-[var(--fyxvo-text)] transition-colors hover:bg-[var(--fyxvo-bg-elevated)]"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
