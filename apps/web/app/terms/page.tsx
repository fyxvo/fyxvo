import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle, Notice } from "@fyxvo/ui";
import { PageHeader } from "../../components/page-header";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms governing use of the Fyxvo devnet private alpha infrastructure platform.",
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

export default function TermsPage() {
  const effectiveDate = "March 19, 2026";

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      <PageHeader
        eyebrow="Legal"
        title="Terms of Service"
        description={`Effective date: ${effectiveDate}. These terms govern your use of the Fyxvo devnet private alpha platform.`}
      />

      <Notice tone="warning" title="Private alpha — read carefully">
        Fyxvo is a private alpha running on Solana devnet. There is no service level agreement, no
        uptime guarantee, and no warranty of any kind. Use the platform to evaluate fit, not to run
        production workloads.
      </Notice>

      <div className="space-y-6">
        <Section title="1. What this service is">
          <p>
            Fyxvo is a developer infrastructure platform providing wallet-authenticated project
            control, SOL-funded JSON-RPC relay, priority relay, analytics, and managed operator
            infrastructure on Solana devnet. The platform consists of a web control surface
            (www.fyxvo.com), a control plane API (api.fyxvo.com), and a relay gateway
            (rpc.fyxvo.com).
          </p>
          <p>
            The platform is currently in private alpha. Features, pricing, data structures, and
            access conditions may change at any time without notice.
          </p>
        </Section>

        <Section title="2. Who can use it">
          <p>
            Access to Fyxvo is currently limited to teams invited to the private alpha or who have
            registered through the public interest form. By using the platform, you confirm that:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>You are at least 18 years old or have the legal capacity to enter contracts in your jurisdiction.</li>
            <li>You are using the platform for development, evaluation, or testing purposes.</li>
            <li>You will not use the platform for illegal activities, fraud, or abuse.</li>
            <li>You understand this is devnet infrastructure and not a mainnet production service.</li>
          </ul>
        </Section>

        <Section title="3. Devnet alpha status and no-SLA disclaimer">
          <p>
            Fyxvo operates on Solana devnet. Devnet is a test environment provided by the Solana
            Foundation and may experience instability, resets, or outages independent of Fyxvo's
            infrastructure.
          </p>
          <p>
            Fyxvo makes no representation about uptime, latency, data persistence, or service
            continuity during the private alpha. There is no SLA, no uptime commitment, and no
            obligation to provide advance notice of downtime.
          </p>
          <p>
            Services may be paused, restructured, or terminated at any time. Alpha participants
            accept this condition by using the platform.
          </p>
        </Section>

        <Section title="4. Acceptable use">
          <p>You agree not to use Fyxvo to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Send spam, abusive requests, or traffic designed to degrade service for other users.</li>
            <li>Attempt to bypass rate limiting, scope enforcement, or funding balance checks.</li>
            <li>Reverse-engineer, scrape, or extract non-public platform data or infrastructure details.</li>
            <li>Use the relay gateway to route requests to unauthorized or malicious nodes.</li>
            <li>Misrepresent your identity, team, or use case in interest or feedback submissions.</li>
            <li>Use the platform in jurisdictions where such services are prohibited by law.</li>
          </ul>
          <p>
            Fyxvo reserves the right to suspend or terminate access for any user who violates these
            terms without prior notice.
          </p>
        </Section>

        <Section title="5. API key responsibility">
          <p>
            API keys issued through the Fyxvo control surface are your responsibility. You are
            responsible for keeping keys secret, assigning appropriate scopes, and revoking keys
            that are no longer needed or may have been compromised.
          </p>
          <p>
            Fyxvo is not liable for unauthorized use of keys that result from your failure to
            protect them. Each key carries explicit scopes and is tied to a funded project. Under-
            scoped or revoked keys are rejected at the gateway.
          </p>
        </Section>

        <Section title="6. Crypto funding and devnet SOL">
          <p>
            Funding transactions use Solana devnet SOL, which has no real-world monetary value.
            Devnet SOL can be obtained from public faucets. Fyxvo does not sell devnet SOL and does
            not accept payment for devnet access.
          </p>
          <p>
            Funded SOL credits are consumed by relay usage according to the pricing model described
            at www.fyxvo.com/pricing. There are no refunds for devnet credits consumed through relay
            usage, because devnet SOL has no monetary value to refund.
          </p>
          <p>
            When the platform transitions to mainnet, a separate terms document covering mainnet
            funding, fees, and refund conditions will be published. These terms do not govern
            mainnet usage.
          </p>
        </Section>

        <Section title="7. Intellectual property">
          <p>
            All code, documentation, design, and infrastructure comprising the Fyxvo platform
            remains the intellectual property of Fyxvo. You are granted a limited, non-exclusive
            license to use the platform for evaluation and development purposes during the private
            alpha.
          </p>
          <p>
            You retain ownership of your project data, your wallet identity, and any workloads you
            run through the relay. Fyxvo does not claim ownership of traffic or data you transmit
            through the gateway.
          </p>
        </Section>

        <Section title="8. Limitation of liability">
          <p>
            To the fullest extent permitted by law, Fyxvo and its contributors are not liable for:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Loss of devnet SOL or funded credits resulting from platform outages or bugs.</li>
            <li>Data loss resulting from platform resets or infrastructure changes.</li>
            <li>Indirect, consequential, or incidental damages arising from platform use.</li>
            <li>Downtime, latency, or errors in the Solana devnet network itself.</li>
          </ul>
          <p>
            You use the platform at your own risk. This is a private alpha. Treat it accordingly.
          </p>
        </Section>

        <Section title="9. How terms may change">
          <p>
            These terms may be updated at any time. The effective date at the top of this page
            reflects the most recent revision. Continued use of the platform after a terms update
            constitutes acceptance of the revised terms.
          </p>
          <p>
            Material changes will be announced through the Fyxvo community channels (X, Discord,
            Telegram) and the status page.
          </p>
        </Section>

        <Section title="10. Governing law">
          <p>
            These terms are governed by applicable law. If any provision is found unenforceable,
            the remaining provisions remain in effect. These terms represent the entire agreement
            between you and Fyxvo regarding use of the private alpha platform.
          </p>
        </Section>
      </div>
    </div>
  );
}
