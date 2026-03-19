import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle, Notice } from "@fyxvo/ui";
import { PageHeader } from "../../components/page-header";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Fyxvo collects, uses, and protects your data on the devnet private alpha platform.",
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

export default function PrivacyPage() {
  const effectiveDate = "March 19, 2026";

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      <PageHeader
        eyebrow="Legal"
        title="Privacy Policy"
        description={`Effective date: ${effectiveDate}. This policy describes how Fyxvo handles personal information collected through the devnet private alpha platform.`}
      />

      <Notice tone="neutral" title="Private alpha context">
        Fyxvo is currently operating as a private alpha on Solana devnet. This policy reflects current
        data practices. It will be updated as the platform evolves toward mainnet.
      </Notice>

      <div className="space-y-6">
        <Section title="1. Who we are">
          <p>
            Fyxvo operates a Solana devnet infrastructure platform providing wallet-authenticated
            project control, funded JSON-RPC relay, and managed operator infrastructure. The platform
            is accessed at www.fyxvo.com with API services at api.fyxvo.com and gateway services at
            rpc.fyxvo.com.
          </p>
          <p>
            For questions about this policy, contact us through the channels listed at{" "}
            <span className="font-mono text-[var(--fyxvo-text)]">www.fyxvo.com/contact</span>.
          </p>
        </Section>

        <Section title="2. What data we collect">
          <p className="font-medium text-[var(--fyxvo-text)]">Wallet addresses</p>
          <p>
            When you connect a Solana wallet, we record your public wallet address. This address is
            used to identify your account and sign your API session. We never request, store, or have
            access to your private key or seed phrase under any circumstances.
          </p>
          <p className="font-medium text-[var(--fyxvo-text)]">Session data</p>
          <p>
            A JWT (JSON Web Token) is issued after wallet authentication. This token is stored in your
            browser session and transmitted with API requests. It expires and is not persisted on our
            servers after expiry.
          </p>
          <p className="font-medium text-[var(--fyxvo-text)]">Request logs</p>
          <p>
            Every JSON-RPC request routed through the gateway is logged with the project identifier,
            route, method, HTTP status code, and response latency. Logs are associated with the
            project that issued the API key, not with personal identity beyond the project owner's
            wallet address.
          </p>
          <p className="font-medium text-[var(--fyxvo-text)]">Project data</p>
          <p>
            Project names, slugs, descriptions, on-chain program-derived addresses (PDAs), and funding
            history are stored in our database. This data is tied to your wallet address.
          </p>
          <p className="font-medium text-[var(--fyxvo-text)]">API keys</p>
          <p>
            API key metadata (label, scopes, prefix, status, creation and last-used timestamps) is
            stored. Full key values are shown once at creation and are not stored in recoverable form
            after that point.
          </p>
          <p className="font-medium text-[var(--fyxvo-text)]">Interest and feedback submissions</p>
          <p>
            If you submit an interest or feedback form, we collect the name, email, team name, use
            case description, expected request volume, and any message you provide. This data is used
            for founder follow-up and product improvement.
          </p>
          <p className="font-medium text-[var(--fyxvo-text)]">Analytics events</p>
          <p>
            Lightweight first-party events (landing CTA clicks, wallet connect intent, project
            creation starts, funding flow starts, API key creation) are recorded without third-party
            tracking scripts. No cross-site tracking is used.
          </p>
        </Section>

        <Section title="3. How wallet addresses are handled">
          <p>
            Your wallet address is a public identifier on the Solana blockchain. We use it to
            associate your account with projects, API keys, and funding records within Fyxvo. We do
            not sell, share, or combine wallet addresses with third-party identity graphs or
            advertising networks.
          </p>
          <p>
            Wallet addresses may appear in admin-visible logs and audit surfaces for fraud prevention
            and governance review. They are not displayed to other users of the platform.
          </p>
        </Section>

        <Section title="4. Request log storage">
          <p>
            Request logs are stored to support analytics, billing reconciliation, rate limit
            enforcement, and operator health reporting. Logs include the request timestamp, route,
            method, HTTP status, latency, service identifier, and project identifier.
          </p>
          <p>
            Request logs do not contain the body of relayed RPC requests. Only routing metadata is
            retained. Devnet request logs are retained for 90 days unless a shorter retention is
            operationally necessary.
          </p>
        </Section>

        <Section title="5. Analytics tracking">
          <p>
            Fyxvo uses first-party analytics only. We record product usage events (listed in Section
            2) using our own API endpoints. We do not use Google Analytics, Mixpanel, Segment, or
            similar third-party analytics services on the current alpha platform.
          </p>
          <p>
            Browser-side analytics are minimal and do not track users across sessions or across other
            websites. No fingerprinting techniques are used.
          </p>
        </Section>

        <Section title="6. Interest and feedback submission storage">
          <p>
            Interest and feedback submissions are stored in our control plane database and are
            accessible to Fyxvo team members for review and follow-up. Submissions are not shared
            with third parties. Email addresses provided in submissions are used only for direct
            founder follow-up and are not added to marketing lists without explicit consent.
          </p>
        </Section>

        <Section title="7. Third-party services">
          <p>The following third-party services are used in the operation of the platform:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <span className="font-medium text-[var(--fyxvo-text)]">Vercel</span> — frontend
              hosting and edge delivery. Vercel may log request metadata including IP addresses and
              request paths.
            </li>
            <li>
              <span className="font-medium text-[var(--fyxvo-text)]">Railway</span> — API and
              gateway backend hosting. Railway may log container-level request metadata.
            </li>
            <li>
              <span className="font-medium text-[var(--fyxvo-text)]">Solana devnet</span> — all
              on-chain transactions are publicly visible on the Solana blockchain. On-chain data
              (project PDAs, funding transactions) is immutable and public by the nature of the
              protocol.
            </li>
          </ul>
          <p>
            We do not use advertising networks, social media pixels, or third-party identity
            services.
          </p>
        </Section>

        <Section title="8. Data retention">
          <p>
            Account data (wallet address, projects, API keys) is retained as long as the account is
            active. Request logs are retained for 90 days on devnet. Interest and feedback
            submissions are retained indefinitely for product review purposes.
          </p>
          <p>
            When the platform moves to mainnet, a formal data retention schedule will be published.
            For deletion requests during the private alpha, contact us directly.
          </p>
        </Section>

        <Section title="9. Your rights">
          <p>
            You have the right to request access to data associated with your wallet address, to
            request deletion of your account data, and to withdraw from the private alpha at any
            time.
          </p>
          <p>
            To exercise these rights, contact us through the support channels at
            www.fyxvo.com/contact. During the private alpha, requests are handled manually with a
            response target of five business days.
          </p>
          <p>
            Note that on-chain data (transactions, PDAs) cannot be deleted as it is part of the
            public Solana blockchain ledger.
          </p>
        </Section>

        <Section title="10. Changes to this policy">
          <p>
            We may update this policy as the platform evolves. Material changes will be communicated
            through the status page or community channels (X, Discord, Telegram). The effective date
            at the top of this page will be updated with each revision.
          </p>
        </Section>
      </div>
    </div>
  );
}
