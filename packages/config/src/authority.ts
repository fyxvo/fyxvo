import { z } from "zod";

export const authorityModeValues = ["single-signer", "multisig", "governed"] as const;
export type AuthorityMode = (typeof authorityModeValues)[number];

const authorityModeSchema = z.enum(authorityModeValues);
const authorityValueSchema = z.string().trim().min(32);

export interface AuthorityPlan {
  readonly mode: AuthorityMode;
  readonly protocolAuthority: string;
  readonly pauseAuthority: string;
  readonly upgradeAuthorityHint: string | null;
  readonly warnings: readonly string[];
}

export function resolveAuthorityPlan(input: {
  readonly source?: Record<string, string | undefined>;
  readonly protocolAuthorityFallback: string;
}) {
  const source = input.source ?? process.env;
  const protocolAuthority = authorityValueSchema.parse(
    source.FYXVO_PROTOCOL_AUTHORITY ?? input.protocolAuthorityFallback
  );
  const pauseAuthority = authorityValueSchema.parse(
    source.FYXVO_PAUSE_AUTHORITY ?? protocolAuthority
  );
  const upgradeAuthorityHint =
    source.FYXVO_UPGRADE_AUTHORITY_HINT && source.FYXVO_UPGRADE_AUTHORITY_HINT.trim().length > 0
      ? authorityValueSchema.parse(source.FYXVO_UPGRADE_AUTHORITY_HINT)
      : null;
  const mode = authorityModeSchema.catch("single-signer").parse(source.FYXVO_AUTHORITY_MODE);

  const warnings: string[] = [];
  if (mode === "single-signer") {
    warnings.push(
      "Single-signer authority is still configured. Move protocol, pause, and upgrade control behind a governed signer before mainnet beta."
    );
  }
  if (pauseAuthority === protocolAuthority) {
    warnings.push(
      "Pause authority is currently the same signer as protocol authority. A future governed rollout should separate review and emergency controls where appropriate."
    );
  }
  if (!upgradeAuthorityHint) {
    warnings.push(
      "Upgrade authority is not documented in runtime config yet. Record the governed signer or multisig before any mainnet deployment."
    );
  }

  return {
    mode,
    protocolAuthority,
    pauseAuthority,
    upgradeAuthorityHint,
    warnings
  } satisfies AuthorityPlan;
}
