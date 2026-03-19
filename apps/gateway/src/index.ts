import { assertProductionEnv, loadGatewayEnv } from "@fyxvo/config";
import { databaseHealthcheck, prisma } from "@fyxvo/database";
import { createClient } from "redis";
import { buildProductionGatewayApp } from "./app.js";

async function assertStartupDependencies(input: {
  readonly databaseUrl: string;
  readonly redisUrl: string;
}) {
  try {
    await databaseHealthcheck(prisma);
  } catch (error) {
    throw new Error(
      `Gateway startup failed because PostgreSQL is unavailable at ${input.databaseUrl}. ${
        error instanceof Error ? error.message : "Unknown database error."
      }`
    );
  }

  const redis = createClient({ url: input.redisUrl });
  try {
    await redis.connect();
    await redis.ping();
  } catch (error) {
    throw new Error(
      `Gateway startup failed because Redis is unavailable at ${input.redisUrl}. ${
        error instanceof Error ? error.message : "Unknown Redis error."
      }`
    );
  } finally {
    await redis.quit().catch(() => undefined);
  }
}

async function main() {
  assertProductionEnv(process.env, "Gateway", [
    "DATABASE_URL",
    "REDIS_URL",
    "WEB_ORIGIN",
    "API_ORIGIN",
    "GATEWAY_UPSTREAM_RPC_URLS"
  ]);

  const env = loadGatewayEnv({
    ...process.env,
    GATEWAY_PORT: process.env.GATEWAY_PORT ?? process.env.PORT ?? "4100",
    DATABASE_URL: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/fyxvo",
    REDIS_URL: process.env.REDIS_URL ?? "redis://localhost:6379",
    WEB_ORIGIN: process.env.WEB_ORIGIN ?? "http://localhost:3000",
    GATEWAY_UPSTREAM_RPC_URLS:
      process.env.GATEWAY_UPSTREAM_RPC_URLS ?? process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com"
  });

  await assertStartupDependencies({
    databaseUrl: env.DATABASE_URL,
    redisUrl: env.REDIS_URL
  });

  const app = await buildProductionGatewayApp({
    env
  });

  await app.listen({
    host: env.GATEWAY_HOST,
    port: env.GATEWAY_PORT
  });
}

main().catch((error: unknown) => {
  console.error(
    JSON.stringify({
      level: "error",
      service: "fyxvo-gateway",
      event: "gateway.startup.failed",
      message: error instanceof Error ? error.message : "Unknown gateway startup failure",
      timestamp: new Date().toISOString()
    })
  );
  process.exit(1);
});
