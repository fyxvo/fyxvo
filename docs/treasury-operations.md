# Treasury Operations

## 1. What The Treasury Surface Means Today

The on-chain treasury account tracks four different categories that should not be blurred together.

1. Free treasury balances.
2. Reserved reward balances.
3. Protocol fees owed.
4. Accepted asset vault addresses and inventory.

The admin overview now exposes these values directly from chain-backed readiness data so operators can review them without reading raw account bytes.

## 2. Reconciliation Discipline

Use this order when reviewing treasury posture.

1. Confirm protocol readiness is green.
2. Confirm the treasury PDA matches the derived address from the configured program ID.
3. Compare `solBalance` and `usdcBalance` against `reserved*Rewards` plus `protocol*FeesOwed`.
4. Treat any case where reserved rewards plus fees owed approaches or exceeds balance as an operational warning.
5. Compare gateway spend growth and funding confirmations before assuming a reconciliation issue is on chain.

## 3. Fee Handling Status

Fee accounting is real. Fee withdrawal is not.

1. The program tracks `protocolSolFeesOwed`.
2. The program tracks `protocolUsdcFeesOwed`.
3. The admin surface now marks fee withdrawal as not ready on purpose.
4. No one should treat tracked fees owed as withdrawable revenue until a reviewed withdrawal instruction exists and is documented.

## 4. Mainnet Requirements

1. Add a reviewed withdrawal path.
2. Define who approves and executes withdrawals.
3. Define reconciliation checkpoints between on-chain treasury state, gateway spend counters, and funding confirmations.
4. Run those procedures in staging before any paid mainnet traffic.
