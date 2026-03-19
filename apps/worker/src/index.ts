import { Redis } from "ioredis";
import { assertProductionEnv } from "@fyxvo/config";
import { databaseHealthcheck, disconnectDatabase, prisma } from "@fyxvo/database";
import { buildProductionWorkerRuntime } from "./runtime.js";

async function assertStartupDependencies(input: {
  readonly databaseUrl: string;
  readonly redisUrl: string;
}) {
  try {
    await databaseHealthcheck(prisma);
  } catch (error) {
    throw new Error(
      `Worker startup failed because PostgreSQL is unavailable at ${input.databaseUrl}. ${
        error instanceof Error ? error.message : "Unknown database error."
      }`
    );
  }

  const redis = new Redis(input.redisUrl, {
    lazyConnect: true,
    maxRetriesPerRequest: 1
  });

  try {
    await redis.connect();
    await redis.ping();
  } catch (error) {
    throw new Error(
      `Worker startup failed because Redis is unavailable at ${input.redisUrl}. ${
        error instanceof Error ? error.message : "Unknown Redis error."
      }`
    );
  } finally {
    await redis.quit().catch(() => undefined);
  }
}

async function main() {
  assertProductionEnv(process.env, "Worker", ["DATABASE_URL", "REDIS_URL"]);

  const databaseUrl = process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/fyxvo";
  const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";

  await assertStartupDependencies({
    databaseUrl,
    redisUrl
  });

  const runtime = buildProductionWorkerRuntime();

  const shutdown = async (signal: string) => {
    await runtime.close();
    await disconnectDatabase(prisma);
    console.log(
      JSON.stringify({
        level: "info",
        service: "fyxvo-worker",
        message: "Worker shutdown completed",
        signal,
        timestamp: new Date().toISOString()
      })
    );
    process.exit(0);
  };

  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });
  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });

  await runtime.start();
}

main().catch(async (error: unknown) => {
  console.error(
    JSON.stringify({
      level: "error",
      service: "fyxvo-worker",
      event: "worker.startup.failed",
      message: error instanceof Error ? error.message : "Unknown worker startup failure",
      timestamp: new Date().toISOString()
    })
  );
  await disconnectDatabase(prisma);
  process.exit(1);
});
