"use client";

import { useState } from "react";
import { usePortal } from "./portal-provider";
import { webEnv } from "../lib/env";

export function TosModal() {
  const portal = usePortal();
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isVisible =
    portal.walletPhase === "authenticated" &&
    portal.user !== null &&
    !portal.user.tosAcceptedAt;

  if (!isVisible) {
    return null;
  }

  async function handleAccept() {
    if (!checked || !portal.token) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(
        new URL("/v1/me/accept-tos", webEnv.apiBaseUrl),
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${portal.token}`,
          },
        }
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? "Failed to record acceptance. Please try again.");
        return;
      }
      await portal.refresh();
    } catch {
      setError("A network error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tos-modal-heading"
    >
      <div className="w-full max-w-md rounded-2xl border border-[var(--fyxvo-border)] bg-[var(--fyxvo-bg-elevated)] p-8 shadow-2xl">
        <h2
          id="tos-modal-heading"
          className="text-xl font-semibold text-[var(--fyxvo-text)]"
        >
          Before you continue
        </h2>
        <p className="mt-2 text-sm text-[var(--fyxvo-text-muted)]">
          Please review and accept the Fyxvo Terms of Service and Privacy Policy
          before accessing the platform.
        </p>

        <ul className="mt-6 space-y-3">
          <li className="flex items-start gap-2 text-sm text-[var(--fyxvo-text)]">
            <span className="mt-0.5 shrink-0 text-[var(--fyxvo-brand)]">•</span>
            <span>
              Fyxvo is currently in <strong>devnet private alpha</strong>. All
              SOL costs and on-chain interactions are test-only and not
              financially binding.
            </span>
          </li>
          <li className="flex items-start gap-2 text-sm text-[var(--fyxvo-text)]">
            <span className="mt-0.5 shrink-0 text-[var(--fyxvo-brand)]">•</span>
            <span>
              API keys grant access to the relay network. You are responsible
              for keeping them secure and not sharing them with unauthorized
              parties.
            </span>
          </li>
          <li className="flex items-start gap-2 text-sm text-[var(--fyxvo-text)]">
            <span className="mt-0.5 shrink-0 text-[var(--fyxvo-brand)]">•</span>
            <span>
              Usage data including wallet address and request logs is collected
              to operate and improve the platform. See the Privacy Policy for
              details.
            </span>
          </li>
        </ul>

        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--fyxvo-brand)] underline underline-offset-2 hover:opacity-80"
          >
            Terms of Service
          </a>
          <span className="text-[var(--fyxvo-text-muted)]">·</span>
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--fyxvo-brand)] underline underline-offset-2 hover:opacity-80"
          >
            Privacy Policy
          </a>
        </div>

        <label className="mt-6 flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--fyxvo-brand)]"
          />
          <span className="text-sm text-[var(--fyxvo-text)]">
            I have read and accept the Terms of Service and Privacy Policy
          </span>
        </label>

        {error ? (
          <p className="mt-3 text-xs text-red-500">{error}</p>
        ) : null}

        <button
          type="button"
          disabled={!checked || submitting}
          onClick={() => void handleAccept()}
          className="mt-6 w-full rounded-lg bg-[var(--fyxvo-brand)] px-4 py-2.5 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40 hover:opacity-90"
        >
          {submitting ? "Saving…" : "Continue"}
        </button>
      </div>
    </div>
  );
}
