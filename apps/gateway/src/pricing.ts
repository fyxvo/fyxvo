import type { GatewayEnv } from "@fyxvo/config";
import type { FundingDecision, JsonRpcPayload, PricingDecision, ProjectFundingState, ProjectSpendState, RoutingMode } from "./types.js";

const WRITE_METHODS = new Set([
  "sendTransaction",
  "sendRawTransaction",
  "simulateTransaction",
  "requestAirdrop"
]);

function normalizePayload(payload: JsonRpcPayload): readonly { method: string }[] {
  const requests = Array.isArray(payload) ? payload : [payload];
  return requests;
}

function methodMultiplier(method: string, env: GatewayEnv): bigint {
  return WRITE_METHODS.has(method) ? BigInt(env.GATEWAY_WRITE_METHOD_MULTIPLIER) : 1n;
}

export function calculateRequestPrice(
  payload: JsonRpcPayload,
  mode: RoutingMode,
  env: GatewayEnv
): PricingDecision {
  const requests = normalizePayload(payload);
  const basePrice =
    mode === "priority"
      ? BigInt(env.GATEWAY_PRIORITY_PRICE_LAMPORTS)
      : BigInt(env.GATEWAY_STANDARD_PRICE_LAMPORTS);
  const totalPrice = requests.reduce(
    (total, request) => total + basePrice * methodMultiplier(request.method, env),
    0n
  );

  return {
    methods: requests.map((request) => request.method),
    requestCount: requests.length,
    basePrice,
    totalPrice
  };
}

export function chooseFundingAsset(input: {
  readonly funding: ProjectFundingState;
  readonly spend: ProjectSpendState;
  readonly requiredCredits: bigint;
  readonly minimumReserve: bigint;
}): FundingDecision | null {
  const availableSol = input.funding.availableSolCredits - input.spend.sol;
  if (availableSol >= input.requiredCredits + input.minimumReserve) {
    return {
      asset: "SOL",
      remainingCredits: availableSol - input.requiredCredits
    };
  }

  const availableUsdc = input.funding.availableUsdcCredits - input.spend.usdc;
  if (availableUsdc >= input.requiredCredits + input.minimumReserve) {
    return {
      asset: "USDC",
      remainingCredits: availableUsdc - input.requiredCredits
    };
  }

  return null;
}
