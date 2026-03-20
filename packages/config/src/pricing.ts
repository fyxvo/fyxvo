/**
 * Fyxvo canonical pricing constants.
 *
 * Source of truth shared across gateway, API, and frontend.
 * Gateway env vars override these defaults; the frontend uses them for display.
 *
 * Tier definitions:
 *   standard     — all standard read methods (getBalance, getAccountInfo, etc.)
 *   compute_heavy — high-CPU methods (getProgramAccounts, getLargestAccounts, etc.)
 *   priority     — /priority relay endpoint (always at priority rate regardless of method)
 *
 * Revenue split on every fee: 80% node operators, 10% protocol treasury, 10% infra.
 * Volume discounts: ≥1M req/month → 20% off; ≥10M req/month → 40% off.
 * Free tier: 10,000 standard requests per new project on devnet.
 */

/** Lamports per request — SOL pricing */
export const PRICING_LAMPORTS = {
  /** 0.000001 SOL per request */
  standard: 1_000,
  /** 0.000003 SOL per request */
  computeHeavy: 3_000,
  /** 0.000005 SOL per request */
  priority: 5_000
} as const;

/** Raw USDC token units per request (6 decimals: 1 USDC = 1,000,000 units) */
export const PRICING_USDC = {
  /** 0.0001 USDC per request */
  standard: 100,
  /** 0.0003 USDC per request */
  computeHeavy: 300,
  /** 0.0005 USDC per request */
  priority: 500
} as const;

/** Revenue split basis points (total must equal 10_000 = 100%) */
export const REVENUE_SPLIT_BPS = {
  /** Node operators receive 80% */
  nodeOperators: 8_000,
  /** Protocol treasury receives 10% */
  protocolTreasury: 1_000,
  /** Infrastructure fund receives 10% */
  infraFund: 1_000
} as const;

/** Volume discount thresholds */
export const VOLUME_DISCOUNT = {
  /** ≥1M requests/month: 20% discount */
  tier1: { monthlyRequests: 1_000_000, discountBps: 2_000 },
  /** ≥10M requests/month: 40% discount */
  tier2: { monthlyRequests: 10_000_000, discountBps: 4_000 }
} as const;

/** Free tier for new projects on devnet */
export const FREE_TIER_REQUESTS = 10_000;

/**
 * Compute-heavy RPC methods — methods that require significantly more upstream
 * compute than a standard read. Charged at PRICING_LAMPORTS.computeHeavy.
 */
export const COMPUTE_HEAVY_METHODS = new Set([
  "getProgramAccounts",
  "getLargestAccounts",
  "getTokenLargestAccounts",
  "getTokenAccountsByOwner",
  "getTokenAccountsByDelegate",
  "getParsedTokenAccountsByOwner",
  "getParsedTokenAccountsByDelegate",
  "getMultipleAccounts",
  "getParsedMultipleAccounts",
  "getSignaturesForAddress",
  "getConfirmedSignaturesForAddress2",
  "getBlockProduction"
]);

/**
 * Write methods — higher routing cost due to transaction handling.
 * Kept separate from compute-heavy; may use a multiplier on the base price.
 */
export const WRITE_METHODS = new Set([
  "sendTransaction",
  "sendRawTransaction",
  "simulateTransaction",
  "requestAirdrop"
]);

/** Apply volume discount to a lamport price. Returns discounted amount. */
export function applyVolumeDiscount(lamports: number, monthlyRequests: number): number {
  if (monthlyRequests >= VOLUME_DISCOUNT.tier2.monthlyRequests) {
    return Math.floor(lamports * (10_000 - VOLUME_DISCOUNT.tier2.discountBps) / 10_000);
  }
  if (monthlyRequests >= VOLUME_DISCOUNT.tier1.monthlyRequests) {
    return Math.floor(lamports * (10_000 - VOLUME_DISCOUNT.tier1.discountBps) / 10_000);
  }
  return lamports;
}

/** Convert lamports to SOL as a human-readable string */
export function lamportsToSolString(lamports: number, decimals = 6): string {
  return (lamports / 1_000_000_000).toFixed(decimals);
}
