# Fyxvo Launch Announcement Assets

_Last updated: 2026-03-20_

---

## X / Twitter (280 chars each)

**Thread opener:**
> Fyxvo is live on Solana devnet. Managed RPC relay, wallet auth, project analytics, and a priority path for time-sensitive transactions. Private alpha is open — connect your wallet and send your first request today. 🔗 fyxvo.com

**Feature thread — Auth:**
> Fyxvo uses wallet-signed JWTs instead of email/password. Connect Phantom, Solflare, or Backpack, sign a challenge, and you're in. No registration form. Your wallet is your identity.

**Feature thread — Relay:**
> Two relay paths: /rpc for standard reads and /priority for time-sensitive transactions. Same URL pattern. Just swap the endpoint. Works with any @solana/web3.js Connection or raw JSON-RPC client.

**Feature thread — Analytics:**
> Every request through Fyxvo is logged by method, latency, and status code. See your p95, daily buckets, and error rate per API key — all scoped to your project. No separate analytics account needed.

**Feature thread — Funding:**
> Projects run on SOL credits deposited to an on-chain treasury PDA. Fund with Phantom in two steps. No card required, no custodian. The chain is the escrow.

**Community CTA:**
> Fyxvo private alpha is open. We want feedback from builders running real Solana workloads on devnet. What's missing? What's broken? Reach us on Discord or open an issue. Link in bio.

---

## Discord announcement

**#announcements channel:**

```
@everyone

Fyxvo is now live in private alpha on Solana devnet.

What Fyxvo is:
→ Managed RPC relay (standard + priority)
→ Project-based API key auth with scopes
→ SOL-funded on-chain treasury for request credits
→ Per-project request analytics and error monitoring
→ Real-time gateway health at status.fyxvo.com

How to get started:
1. Go to fyxvo.com and connect your Solana wallet
2. Create a project and activate it on-chain
3. Deposit a small amount of devnet SOL
4. Issue an API key and point your app at rpc.fyxvo.com

Docs: fyxvo.com/docs
Pricing: fyxvo.com/pricing
Status: status.fyxvo.com

This is devnet only. Mainnet is coming after alpha feedback.
Drop questions here or in #support.
```

---

## Newsletter (email body)

**Subject:** Fyxvo private alpha is live — managed Solana RPC for devnet builders

**Body:**

Hi,

We shipped the first usable version of Fyxvo today. Here's what it does and why we built it.

**What Fyxvo is**

Fyxvo is a managed Solana RPC relay for teams that want more than a public endpoint. It gives you:

- A standard relay at `rpc.fyxvo.com/rpc` and a priority relay at `rpc.fyxvo.com/priority`
- Wallet-authenticated projects with API key scoping
- SOL-funded on-chain treasury PDAs for request credits
- Request logging, latency analytics, and error rate monitoring per project
- Real-time gateway health at `status.fyxvo.com`

It's for builders who are serious about devnet and want honest infrastructure — not a managed node disguised as a public endpoint.

**What's live today**

- Wallet auth (Phantom, Solflare, Backpack, Coinbase Wallet)
- Standard RPC relay
- Priority relay for high-throughput transaction submission
- Project activation on-chain (Solana program on devnet)
- SOL funding via Phantom
- API key management with scopes
- Per-project analytics: request counts, latency, error breakdown, CSV export
- Notification system (low balance, key events, funding confirmed)
- Developer AI assistant (Claude-powered, project-context aware)
- Webhooks for funding, key, and balance events
- Team collaboration (invite by wallet address)
- Public project profiles

**What isn't live yet**

USDC funding, mainnet, and the operator node marketplace are planned. USDC is configured on devnet but gated. Mainnet is not available until alpha feedback is incorporated.

**How to try it**

Go to [fyxvo.com](https://fyxvo.com), connect a Solana wallet, and follow the 5-step quickstart in the docs. You'll need a small amount of devnet SOL — get it from the Solana faucet.

We're looking for feedback on what's broken, what's missing, and what doesn't make sense. Reply to this email or join our Discord.

— The Fyxvo team

---

## LinkedIn post

Fyxvo is live in private alpha.

We've been building managed Solana RPC infrastructure for developers who want something better than shared public endpoints. Today we're opening access on devnet.

What it does:
✓ Standard and priority RPC relay with project-scoped API keys
✓ On-chain treasury funding via Phantom wallet
✓ Per-project request analytics (latency, error rate, method breakdown)
✓ Real-time gateway health monitoring
✓ Webhook delivery for funding, key, and balance events
✓ Team collaboration with role-based access

It's for DeFi, gaming, payments, and infrastructure teams building production workloads on Solana.

Alpha is open at fyxvo.com. Mainnet is next.

#Solana #Web3 #DeveloperInfrastructure #RPC

---

## Hacker News submission

**Title:** Fyxvo – Managed Solana RPC relay with on-chain treasury and project analytics (devnet alpha)

**URL:** https://fyxvo.com

**Text (for Show HN):**

We built Fyxvo because we kept running into the same problem: public Solana RPC endpoints are shared, unmetered, and opaque. You have no visibility into your own traffic, no rate limit information, and no path to dedicated capacity when you need it.

Fyxvo is a managed relay that gives you:
- Project-based API keys with scope enforcement
- SOL-funded on-chain treasury PDAs for request credits (via a deployed Solana program)
- Standard RPC + priority relay (separate endpoints)
- Per-request logging, latency analytics, and error breakdown

It uses wallet-signed JWTs for auth (Phantom, Solflare, Backpack). No email. No credit card. Your wallet is your identity. Projects are activated by submitting an on-chain transaction to our deployed program on devnet.

Technical choices we're happy to discuss: the Fastify API (TypeScript), Solana program (Anchor), Next.js frontend, and the Prisma-backed analytics pipeline.

Alpha is devnet only. Looking for feedback from teams with real traffic.
