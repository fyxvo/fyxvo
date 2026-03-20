# @fyxvo/sdk

Official TypeScript SDK for the [Fyxvo](https://www.fyxvo.com) Solana devnet RPC relay gateway.

## What is Fyxvo?

Fyxvo is a managed, wallet-authenticated RPC relay for Solana devnet. You fund a project with SOL, create scoped API keys, and route JSON-RPC requests through the Fyxvo gateway. Fyxvo handles the node infrastructure, rate limiting, and analytics.

## Installation

```bash
npm install @fyxvo/sdk
# or
pnpm add @fyxvo/sdk
```

## Quick Start

```typescript
import { createFyxvoClient } from "@fyxvo/sdk";

const fyxvo = createFyxvoClient({
  apiKey: "fyxvo_live_YOUR_KEY_HERE",
  // Optional: defaults to https://rpc.fyxvo.com
  gatewayUrl: "https://rpc.fyxvo.com",
});

// Send a standard JSON-RPC request
const slotResult = await fyxvo.rpc<number>("getSlot");
console.log("Current slot:", slotResult);

// Get the balance of a wallet
const balance = await fyxvo.rpc<{ value: number }>("getBalance", [
  "FQ5pyjBQvfadKPPxd66YXksgn8veYnjEw2R1g6aQnFaa"
]);
console.log("Balance (lamports):", balance.value);
```

## Priority Relay

Priority requests are routed through a low-latency path with guaranteed capacity:

```typescript
const fyxvo = createFyxvoClient({
  apiKey: "fyxvo_live_YOUR_KEY_HERE",
  gatewayUrl: "https://rpc.fyxvo.com",
  usePriority: true, // route all requests through /priority
});

const latestBlockhash = await fyxvo.rpc<{
  value: { blockhash: string; lastValidBlockHeight: number }
}>("getLatestBlockhash");
```

## Error Handling

```typescript
import { createFyxvoClient, FyxvoApiError, FyxvoNetworkError } from "@fyxvo/sdk";

const fyxvo = createFyxvoClient({ apiKey: "fyxvo_live_..." });

try {
  const result = await fyxvo.rpc("getBalance", ["<pubkey>"]);
} catch (err) {
  if (err instanceof FyxvoApiError) {
    // API returned an error response (4xx/5xx)
    console.error(`API error ${err.statusCode}: ${err.message}`);
  } else if (err instanceof FyxvoNetworkError) {
    // Network connectivity issue
    console.error("Network error:", err.message);
  } else {
    throw err;
  }
}
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | `string` | required | Your Fyxvo API key (starts with `fyxvo_live_`) |
| `gatewayUrl` | `string` | `https://rpc.fyxvo.com` | Gateway base URL |
| `apiBaseUrl` | `string` | `https://api.fyxvo.com` | Control plane API base URL |
| `timeout` | `number` | `10000` | Request timeout in milliseconds |
| `usePriority` | `boolean` | `false` | Route all RPC requests through the priority path |

## Checking Gateway Health

```typescript
const health = await fyxvo.getGatewayHealth();
console.log(health.status); // "ok" | "degraded"
```

## Publishing

This package is published manually by the Fyxvo team. To publish a new version:

```bash
# From the monorepo root
cd /path/to/fyxvo
npm login
pnpm --filter @fyxvo/sdk publish --access public
```

## License

MIT © Fyxvo
