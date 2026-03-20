import { assertProductionEnv, assertProductionSecret, loadApiEnv } from "@fyxvo/config";
import { databaseHealthcheck, prisma } from "@fyxvo/database";
import { createClient } from "redis";
import { buildProductionApiApp } from "./app.js";

async function assertStartupDependencies(input: {
  readonly databaseUrl: string;
  readonly redisUrl: string;
}) {
  try {
    await databaseHealthcheck(prisma);
  } catch (error) {
    throw new Error(
      `API startup failed because PostgreSQL is unavailable at ${input.databaseUrl}. ${
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
      `API startup failed because Redis is unavailable at ${input.redisUrl}. ${
        error instanceof Error ? error.message : "Unknown Redis error."
      }`
    );
  } finally {
    await redis.quit().catch(() => undefined);
  }
}

async function main() {
  assertProductionEnv(process.env, "API", [
    "DATABASE_URL",
    "REDIS_URL",
    "WEB_ORIGIN",
    "API_JWT_SECRET"
  ]);
  assertProductionSecret(process.env, {
    serviceName: "API",
    key: "API_JWT_SECRET",
    minLength: 32,
    disallowedValues: ["fyxvo-development-session-secret-change-me"]
  });

  const env = loadApiEnv({
    ...process.env,
    API_PORT: process.env.API_PORT ?? process.env.PORT ?? "4000",
    DATABASE_URL: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/fyxvo",
    REDIS_URL: process.env.REDIS_URL ?? "redis://localhost:6379",
    WEB_ORIGIN: process.env.WEB_ORIGIN ?? "http://localhost:3000"
  });

  await assertStartupDependencies({
    databaseUrl: env.DATABASE_URL,
    redisUrl: env.REDIS_URL
  });
  if (!env.ANTHROPIC_API_KEY) {
    console.warn(
      JSON.stringify({
        level: "warn",
        service: "fyxvo-api",
        event: "api.startup.warning",
        message: "ANTHROPIC_API_KEY is not configured. POST /v1/assistant/chat will return 503 until the key is set.",
        timestamp: new Date().toISOString()
      })
    );
  }

  const app = await buildProductionApiApp({
    env,
    prisma
  });

  await app.listen({
    host: env.API_HOST,
    port: env.API_PORT
  });
}

main().catch((error: unknown) => {
  console.error(
    JSON.stringify({
      level: "error",
      service: "fyxvo-api",
      event: "api.startup.failed",
      message: error instanceof Error ? error.message : "Unknown API startup failure",
      timestamp: new Date().toISOString()
    })
  );
  process.exit(1);
});
