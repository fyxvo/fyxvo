# Team and Operations Guide

## 1. Scope

This guide explains how Fyxvo behaves for early teams on Solana devnet today.

It covers:

1. Project lifecycle
2. Activation and funding lifecycle
3. Managed operator role today versus later
4. Usage limits and rate-limiting behavior
5. What teams should expect on devnet

## 2. Project Lifecycle

The current product is ready for real team evaluation, but the access model is still owner-admin driven.

1. A wallet owner authenticates by signing a plain-text challenge.
2. That owner creates the project in the control plane.
3. The same flow prepares the real on-chain activation transaction.
4. Once the wallet signs and confirms the activation transaction, the project becomes live for funded relay usage.
5. API keys belong to the project, not to a generic account-wide namespace.
6. Analytics, request logs, and status surfaces all anchor back to the project.

What is not claimed as live yet:

1. Full collaborator invitation and role management inside the product.
2. Shared member permissions for non-owner developers.
3. A project membership workflow beyond the current owner-admin model.

Fyxvo keeps those limitations explicit so teams can evaluate the product honestly.

## 3. Activation and Funding Lifecycle

Project activation and funding are separate steps.

1. Create the project first.
2. Sign the activation transaction.
3. Wait for the API to verify that activation on devnet.
4. Only then does funding become operationally useful.
5. Prepare the funding transaction through the API.
6. Review the amount in lamports.
7. Sign and send it through the connected wallet.
8. Wait for API-side signature verification and balance refresh.
9. Generate or reuse an API key and send the first relay request.

If the activation step is missing:

1. The project exists in the control plane, but the gateway should not be treated as ready.
2. Funding guidance should be treated as preparatory, not complete.

If the funding step is missing:

1. The gateway can reject usage even if the API key already exists.
2. Teams should expect balance-backed access control, not soft trial behavior.

## 4. Usage Governance and Rate Limiting

Fyxvo applies usage governance at the gateway and the product surface should be read with that in mind.

1. API keys map requests back to a specific project.
2. Project balances are checked against real on-chain-backed project funding state.
3. Redis-backed rate limiting still applies even for funded projects.
4. Standard RPC and priority relay are separate paths on purpose.
5. Priority traffic should be used deliberately, not as a hidden default.

What teams should watch:

1. Spendable SOL credits on the project page and funding page.
2. `429` responses in analytics and project status distributions.
3. Public status surfaces for gateway health, success rate, and latency.
4. Low-balance warnings before broader team testing.

The safe early pattern is:

1. Start with one activated project.
2. Fund it with a small SOL amount.
3. Generate one standard relay key.
4. Send one request.
5. Confirm analytics and logs.
6. Only then widen traffic or add a priority path.

## 5. Operator Role Today Versus Later

The current launch topology is managed infrastructure first.

Today:

1. Managed operator accounts are seeded on chain.
2. Node health and reputation are monitored by the worker.
3. Routing quality, incident response, and reward-context visibility all depend on that managed path.

Later:

1. External operator participation can expand once registration, routing policy, and governance are ready.
2. That path is not marketed as live until the product and protocol actually support it.

This is why the operator page uses managed-language deliberately. It is meant to be operationally useful, not aspirationally vague.

## 6. What Teams Should Expect On Devnet

Devnet is live and useful, but it is still devnet.

1. SOL is the public live funding path today.
2. USDC remains configuration-gated until explicitly enabled and validated for the deployment.
3. Hosted API, gateway, worker, and status surfaces are real.
4. The Anchor program is deployed and active on devnet.
5. Rate limits, relay errors, and funding state should all be treated as real product behavior.
6. Wallet network mismatch, faucet limits, and devnet instability are still part of the environment.

Teams evaluating Fyxvo on devnet should expect:

1. Real control-plane behavior
2. Real funding checks
3. Real relay usage
4. Real analytics updates
5. A managed launch posture rather than a fully decentralized operator market
