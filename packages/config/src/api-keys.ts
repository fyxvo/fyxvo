export const supportedApiKeyScopes = [
  "project:read",
  "project:write",
  "funding:prepare",
  "analytics:read",
  "rpc:request",
  "priority:relay"
] as const;

export type ApiKeyScope = (typeof supportedApiKeyScopes)[number];
export type GatewayScopeMode = "standard" | "priority";

export function normalizeApiKeyScopes(scopes: readonly string[]): ApiKeyScope[] {
  return Array.from(new Set(scopes))
    .filter((scope): scope is ApiKeyScope =>
      (supportedApiKeyScopes as readonly string[]).includes(scope)
    )
    .sort((left, right) => supportedApiKeyScopes.indexOf(left) - supportedApiKeyScopes.indexOf(right));
}

export function gatewayRequiredApiKeyScopes(mode: GatewayScopeMode): readonly ApiKeyScope[] {
  return mode === "priority" ? ["rpc:request", "priority:relay"] : ["rpc:request"];
}

export function getMissingApiKeyScopes(input: {
  readonly grantedScopes: readonly string[];
  readonly requiredScopes: readonly string[];
}) {
  const granted = new Set(input.grantedScopes);
  return input.requiredScopes.filter((scope) => !granted.has(scope));
}

export function hasRequiredApiKeyScopes(input: {
  readonly grantedScopes: readonly string[];
  readonly requiredScopes: readonly string[];
}) {
  return getMissingApiKeyScopes(input).length === 0;
}
