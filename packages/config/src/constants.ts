export const APP_NAME = "Fyxvo";
export const API_VERSION = "v1";
export const DEFAULT_STAGE = "development";
export const DEFAULT_LOG_LEVEL = "info";
export const DEFAULT_DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/fyxvo";
export const DEFAULT_REDIS_URL = "redis://localhost:6379";
export const DEFAULT_SOLANA_COMMITMENT = "confirmed";
export const DEFAULT_REQUEST_TIMEOUT_MS = 10_000;

export const servicePorts = {
  web: 3000,
  api: 4000,
  gateway: 4100
} as const;

export const workspaceMetadata = {
  name: APP_NAME,
  apiVersion: API_VERSION,
  ports: servicePorts,
  services: ["web", "api", "gateway", "worker"] as const,
  packages: ["config", "database", "sdk", "ui"] as const,
  program: "fyxvo"
} as const;

export type RuntimeStage = "development" | "test" | "production";
