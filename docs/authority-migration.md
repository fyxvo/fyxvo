# Authority Migration Guide

## 1. Current State

Fyxvo still runs with a single live protocol signer on devnet.

1. The on-chain protocol authority is `AgMDb4kHaUKqZSjZvFUoKpXYYTjz5Lg5pf3CwYuyAsem`.
2. The current pause control is the same signer because the program still uses one authority field.
3. Upgrade authority should not be treated as implied knowledge. Record it explicitly before any mainnet beta.

This is honest devnet posture. It is not the target governance model for mainnet.

## 2. Runtime Preparation Added In The Repo

The codebase now separates governance intent from the currently live single signer.

1. `FYXVO_AUTHORITY_MODE` documents whether the deployment is still `single-signer`, has moved to `multisig`, or uses another governed path.
2. `FYXVO_PROTOCOL_AUTHORITY` records the intended protocol authority signer.
3. `FYXVO_PAUSE_AUTHORITY` records the intended pause authority signer.
4. `FYXVO_UPGRADE_AUTHORITY_HINT` records the intended upgrade authority signer or multisig for operations visibility.

These settings do not fake multisig. They make the migration path explicit in runtime config and admin surfaces.

## 3. Recommended Migration Order

1. Record the current upgrade authority and operational owners in secure internal documentation.
2. Create the target multisig or governed signer set.
3. Move upgrade authority first.
4. Move protocol authority and pause authority together if the program still uses one authority field.
5. Update hosted env values so admin status surfaces show the governed signer plan.
6. Re-run protocol readiness, treasury checks, and funding flow verification after authority rotation.

## 4. Warnings Before Mainnet Beta

1. Do not run mainnet beta with `FYXVO_AUTHORITY_MODE=single-signer`.
2. Do not leave `FYXVO_UPGRADE_AUTHORITY_HINT` unset for a real launch environment.
3. Do not announce governed controls unless the signer migration is complete on chain and reflected in runtime config.
