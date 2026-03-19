import Link from "next/link";
import { BrandLogo } from "./brand-logo";
import { SocialLinks } from "./social-links";
import { webEnv } from "../lib/env";

const productLinks = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/docs", label: "Docs" },
  { href: "/pricing", label: "Pricing" },
  { href: "/status", label: "Status" },
  { href: "/contact", label: "Contact" },
];

const infraLinks = [
  { href: webEnv.apiBaseUrl, label: "API", external: true },
  { href: `${webEnv.gatewayBaseUrl}/rpc`, label: "RPC gateway", external: true },
  { href: `${webEnv.gatewayBaseUrl}/priority`, label: "Priority relay", external: true },
  { href: "/operators", label: "Operators" },
];

const legalLinks = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/cookies", label: "Cookie Policy" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--fyxvo-border)] bg-[var(--fyxvo-bg)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="space-y-4">
            <BrandLogo />
            <p className="max-w-sm text-sm leading-6 text-[var(--fyxvo-text-muted)]">
              Funded Solana RPC, wallet-authenticated project control, and honest devnet status in
              one surface. SOL is live. USDC is gated. Operator infrastructure is managed.
            </p>
            <div className="inline-flex items-center gap-2 rounded-md border border-[var(--fyxvo-border)] px-3 py-1.5 text-xs text-[var(--fyxvo-text-muted)]">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
              Solana devnet · Private alpha
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--fyxvo-text-muted)]">
              Product
            </p>
            <div className="space-y-2">
              {productLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-sm text-[var(--fyxvo-text-muted)] transition-colors hover:text-[var(--fyxvo-text)]"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--fyxvo-text-muted)]">
              Infrastructure
            </p>
            <div className="space-y-2">
              {infraLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  target={"external" in link && link.external ? "_blank" : undefined}
                  rel={"external" in link && link.external ? "noreferrer" : undefined}
                  className="block text-sm text-[var(--fyxvo-text-muted)] transition-colors hover:text-[var(--fyxvo-text)]"
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="pt-2">
              <SocialLinks />
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--fyxvo-text-muted)]">
              Legal
            </p>
            <div className="space-y-2">
              {legalLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-sm text-[var(--fyxvo-text-muted)] transition-colors hover:text-[var(--fyxvo-text)]"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--fyxvo-border)] pt-6">
          <p className="text-xs text-[var(--fyxvo-text-muted)]">
            Fyxvo · Private alpha · Solana devnet · {new Date().getFullYear()}
          </p>
          <p className="font-mono text-xs text-[var(--fyxvo-text-muted)]">
            FQ5pyjBQvfadKPPxd66YXksgn8veYnjEw2R1g6aQnFaa
          </p>
        </div>
      </div>
    </footer>
  );
}
