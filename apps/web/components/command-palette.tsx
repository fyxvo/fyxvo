"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { usePortal } from "./portal-provider";

interface NavEntry {
  label: string;
  href: string;
  group?: string;
}

function buildNavEntries(selectedProjectSlug?: string | null): NavEntry[] {
  const entries: NavEntry[] = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Projects", href: "/projects" },
    { label: "API Keys", href: "/api-keys" },
    { label: "Funding", href: "/funding" },
    { label: "Analytics", href: "/analytics" },
    { label: "Settings", href: "/settings" },
    { label: "Docs", href: "/docs" },
    { label: "Status", href: "/status" },
    { label: "Operators", href: "/operators" },
  ];

  if (selectedProjectSlug) {
    entries.splice(2, 0, {
      label: `Project: ${selectedProjectSlug}`,
      href: `/projects/${selectedProjectSlug}`,
      group: "project",
    });
  }

  return entries;
}

export function CommandPalette() {
  const portal = usePortal();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const entries = buildNavEntries(portal.selectedProject?.slug);
  const filtered = query.trim()
    ? entries.filter((e) => e.label.toLowerCase().includes(query.toLowerCase()))
    : entries;

  // Reset highlight when filter changes
  useEffect(() => {
    startTransition(() => setHighlighted(0));
  }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      window.setTimeout(() => inputRef.current?.focus(), 10);
    } else {
      startTransition(() => {
        setQuery("");
        setHighlighted(0);
      });
    }
  }, [open]);

  // Global keyboard shortcut
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }

      if (!open) return;

      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlighted((v) => (v + 1) % Math.max(filtered.length, 1));
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlighted((v) => (v - 1 + Math.max(filtered.length, 1)) % Math.max(filtered.length, 1));
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        const item = filtered[highlighted];
        if (item) {
          router.push(item.href);
          setOpen(false);
        }
        return;
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, filtered, highlighted, router]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4"
      style={{ background: "rgba(0,0,0,0.4)" }}
      onMouseDown={(e) => {
        // Close when clicking the backdrop (not the dialog)
        if (e.target === overlayRef.current) {
          setOpen(false);
        }
      }}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--fyxvo-border)] bg-[var(--fyxvo-bg-elevated)] shadow-[0_24px_64px_rgba(0,0,0,0.32)] backdrop-blur-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-[var(--fyxvo-border)] px-4 py-3">
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            className="h-4 w-4 shrink-0 text-[var(--fyxvo-text-muted)]"
            aria-hidden="true"
          >
            <circle cx="8.5" cy="8.5" r="5.5" />
            <path d="M13 13l3.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages…"
            className="flex-1 bg-transparent text-sm text-[var(--fyxvo-text)] outline-none placeholder:text-[var(--fyxvo-text-muted)]"
            aria-label="Command palette search"
          />
          <kbd className="hidden shrink-0 rounded border border-[var(--fyxvo-border)] bg-[var(--fyxvo-panel-soft)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--fyxvo-text-muted)] sm:block">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <svg
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="h-6 w-6 text-[var(--fyxvo-text-muted)]"
                aria-hidden="true"
              >
                <circle cx="8.5" cy="8.5" r="5.5" />
                <path d="M13 13l3.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-sm text-[var(--fyxvo-text-muted)]">No results for &ldquo;{query}&rdquo;</p>
            </div>
          ) : (
            <ul role="listbox" aria-label="Navigation results">
              {filtered.map((item, idx) => {
                const isHighlighted = idx === highlighted;
                return (
                  <li key={item.href} role="option" aria-selected={isHighlighted}>
                    <button
                      type="button"
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                        isHighlighted
                          ? "bg-[var(--fyxvo-brand,#7c3aed)]/10 text-[var(--fyxvo-text)]"
                          : "text-[var(--fyxvo-text-soft)] hover:bg-[var(--fyxvo-panel-soft)] hover:text-[var(--fyxvo-text)]"
                      }`}
                      onMouseEnter={() => setHighlighted(idx)}
                      onClick={() => {
                        router.push(item.href);
                        setOpen(false);
                      }}
                    >
                      <span className="flex-1 font-medium">{item.label}</span>
                      <span className="shrink-0 font-mono text-[11px] text-[var(--fyxvo-text-muted)]">
                        {item.href}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[var(--fyxvo-border)] px-4 py-2">
          <div className="flex items-center gap-3 text-[10px] text-[var(--fyxvo-text-muted)]">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-[var(--fyxvo-border)] bg-[var(--fyxvo-panel-soft)] px-1 py-0.5 font-mono">↑</kbd>
              <kbd className="rounded border border-[var(--fyxvo-border)] bg-[var(--fyxvo-panel-soft)] px-1 py-0.5 font-mono">↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-[var(--fyxvo-border)] bg-[var(--fyxvo-panel-soft)] px-1 py-0.5 font-mono">↵</kbd>
              go
            </span>
          </div>
          <span className="text-[10px] font-medium text-[var(--fyxvo-text-muted)]">⌘K</span>
        </div>
      </div>
    </div>
  );
}
