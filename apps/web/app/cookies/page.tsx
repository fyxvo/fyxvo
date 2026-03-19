import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle, Notice } from "@fyxvo/ui";
import { PageHeader } from "../../components/page-header";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "What cookies and local storage Fyxvo uses and how to manage them.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="fyxvo-surface border-[color:var(--fyxvo-border)]">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm leading-7 text-[var(--fyxvo-text-soft)]">
        {children}
      </CardContent>
    </Card>
  );
}

function StorageRow({ name, type, purpose, duration }: {
  name: string;
  type: string;
  purpose: string;
  duration: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--fyxvo-border)] bg-[var(--fyxvo-panel-soft)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <span className="font-mono text-sm font-medium text-[var(--fyxvo-text)]">{name}</span>
        <span className="rounded-full border border-[var(--fyxvo-border)] px-2.5 py-0.5 text-xs text-[var(--fyxvo-text-muted)]">
          {type}
        </span>
      </div>
      <p className="mt-2 text-sm text-[var(--fyxvo-text-soft)]">{purpose}</p>
      <p className="mt-1 text-xs text-[var(--fyxvo-text-muted)]">Duration: {duration}</p>
    </div>
  );
}

export default function CookiesPage() {
  const effectiveDate = "March 19, 2026";

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      <PageHeader
        eyebrow="Legal"
        title="Cookie Policy"
        description={`Effective date: ${effectiveDate}. This policy explains what cookies and local storage Fyxvo uses and how you can manage them.`}
      />

      <Notice tone="neutral" title="Minimal tracking">
        Fyxvo does not use advertising cookies, third-party tracking pixels, or cross-site
        analytics. Storage is limited to session management, preferences, and first-party product
        analytics.
      </Notice>

      <div className="space-y-6">
        <Section title="1. What we use and why">
          <p>
            Fyxvo uses browser local storage and session storage rather than traditional HTTP cookies
            for most client-side persistence. The following items are stored:
          </p>

          <div className="space-y-3 mt-4">
            <StorageRow
              name="fyxvo-token"
              type="Local storage"
              purpose="Stores the JWT auth token after wallet authentication. Used to keep your API session active between page loads without requiring wallet re-authentication."
              duration="Until session expires or you disconnect your wallet"
            />
            <StorageRow
              name="fyxvo-theme"
              type="Local storage"
              purpose="Stores your preferred theme (dark or light mode) so the correct theme loads on your next visit."
              duration="Persistent until cleared"
            />
            <StorageRow
              name="fyxvo-cookies-accepted"
              type="Local storage"
              purpose="Records that you have dismissed the cookie notice so it does not appear on every page load."
              duration="Persistent until cleared"
            />
          </div>
        </Section>

        <Section title="2. Infrastructure and hosting cookies">
          <p>
            Vercel, which hosts the Fyxvo frontend, may set performance and security cookies as
            part of its edge delivery infrastructure. These are set by Vercel and are not under
            Fyxvo's direct control. Vercel's privacy policy describes what it collects:
            vercel.com/legal/privacy-policy.
          </p>
          <p>
            Railway, which hosts the API and gateway backends, does not set browser-side cookies.
            It may log server-side request metadata for operational purposes.
          </p>
        </Section>

        <Section title="3. What we do not use">
          <p>Fyxvo does not use:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Advertising or remarketing cookies</li>
            <li>Third-party analytics cookies (Google Analytics, Mixpanel, etc.)</li>
            <li>Social media tracking pixels (Meta, X, LinkedIn, etc.)</li>
            <li>Cross-site tracking or user fingerprinting</li>
            <li>Persistent device identifiers beyond browser storage</li>
          </ul>
        </Section>

        <Section title="4. How to manage storage">
          <p>
            You can clear all Fyxvo local storage at any time through your browser settings or
            developer tools. Clearing storage will:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Log you out of your current wallet session (fyxvo-token)</li>
            <li>Reset your theme preference to the platform default</li>
            <li>Reset the cookie notice dismissal</li>
          </ul>
          <p>
            To clear local storage in Chrome: open DevTools (F12) → Application → Storage → Local
            Storage → select the Fyxvo origin → clear entries.
          </p>
          <p>
            In Firefox: open DevTools (F12) → Storage → Local Storage → select the Fyxvo origin →
            right-click and delete items.
          </p>
          <p>
            Clearing storage does not delete your account data, projects, or API keys from the
            Fyxvo servers. That data persists on our backend until you request deletion (see the
            Privacy Policy for deletion requests).
          </p>
        </Section>

        <Section title="5. Changes to this policy">
          <p>
            This policy will be updated if new storage mechanisms are introduced. The effective date
            at the top of this page reflects the most recent revision. Changes will be communicated
            through the Fyxvo community channels.
          </p>
        </Section>
      </div>
    </div>
  );
}
