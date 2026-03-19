import { spawn } from "node:child_process";
import { execFileSync } from "node:child_process";
import { createInterface } from "node:readline";
import process from "node:process";

const runtimeEnv: NodeJS.ProcessEnv = {
  ...process.env,
  FYXVO_ENV: process.env.FYXVO_ENV ?? "development",
  LOG_LEVEL: process.env.LOG_LEVEL ?? "info",
  DATABASE_URL:
    process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/fyxvo",
  REDIS_URL: process.env.REDIS_URL ?? "redis://localhost:6379",
  WEB_ORIGIN: process.env.WEB_ORIGIN ?? "http://localhost:3000",
  SOLANA_CLUSTER: process.env.SOLANA_CLUSTER ?? "devnet",
  SOLANA_RPC_URL: process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com",
  SOLANA_WS_URL: process.env.SOLANA_WS_URL ?? "wss://api.devnet.solana.com",
  API_HOST: process.env.API_HOST ?? "0.0.0.0",
  API_PORT: process.env.API_PORT ?? "4000",
  API_ORIGIN: process.env.API_ORIGIN ?? "http://localhost:4000",
  GATEWAY_HOST: process.env.GATEWAY_HOST ?? "0.0.0.0",
  GATEWAY_PORT: process.env.GATEWAY_PORT ?? "4100",
  GATEWAY_UPSTREAM_RPC_URLS:
    process.env.GATEWAY_UPSTREAM_RPC_URLS ??
    process.env.SOLANA_RPC_URL ??
    "https://api.devnet.solana.com",
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME ?? "Fyxvo",
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  NEXT_PUBLIC_API_BASE_URL:
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000",
  NEXT_PUBLIC_GATEWAY_BASE_URL:
    process.env.NEXT_PUBLIC_GATEWAY_BASE_URL ?? "http://localhost:4100",
  NEXT_PUBLIC_SOLANA_CLUSTER: process.env.NEXT_PUBLIC_SOLANA_CLUSTER ?? "devnet",
  NEXT_PUBLIC_SOLANA_RPC_URL:
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com",
  NEXT_PUBLIC_ENABLE_USDC:
    process.env.NEXT_PUBLIC_ENABLE_USDC ?? process.env.FYXVO_ENABLE_USDC ?? "false"
};

const services = [
  { name: "api", filter: "@fyxvo/api", readyUrl: "http://localhost:4000/health" },
  { name: "gateway", filter: "@fyxvo/gateway", readyUrl: "http://localhost:4100/health" },
  { name: "worker", filter: "@fyxvo/worker" },
  { name: "web", filter: "@fyxvo/web", readyUrl: "http://localhost:3000" }
] as const;

const longRunningChildren: Array<ReturnType<typeof spawn>> = [];
let shuttingDown = false;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readCommandLines(): Array<{ pid: number; command: string }> {
  const stdout = execFileSync("ps", ["-eo", "pid=,command="], {
    cwd: process.cwd(),
    env: runtimeEnv,
    encoding: "utf8"
  });

  return stdout
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const [pidText, ...commandParts] = line.split(/\s+/);
      return {
        pid: Number(pidText),
        command: commandParts.join(" ")
      };
    })
    .filter((entry) => Number.isInteger(entry.pid) && entry.pid > 0);
}

function listListeningPids(port: number): number[] {
  try {
    const stdout = execFileSync(
      "lsof",
      ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN", "-t"],
      {
        cwd: process.cwd(),
        env: runtimeEnv,
        encoding: "utf8"
      }
    );

    return stdout
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => Number(line))
      .filter((pid) => Number.isInteger(pid) && pid > 0);
  } catch {
    return [];
  }
}

function readProcessCommand(pid: number): string {
  try {
    return execFileSync("ps", ["-p", String(pid), "-o", "command="], {
      cwd: process.cwd(),
      env: runtimeEnv,
      encoding: "utf8"
    }).trim();
  } catch {
    return "";
  }
}

function isFyxvoDevCommand(command: string) {
  return (
    command.includes(process.cwd()) &&
    (command.includes("scripts/dev-full.ts") ||
      command.includes("next dev --hostname 0.0.0.0 --port 3000") ||
      command.includes("apps/api") ||
      command.includes("apps/gateway") ||
      command.includes("apps/worker"))
  );
}

async function cleanupStaleFyxvoProcesses() {
  const staleProcesses = readCommandLines().filter(
    (entry) =>
      entry.pid !== process.pid &&
      entry.pid !== process.ppid &&
      isFyxvoDevCommand(entry.command)
  );

  for (const entry of staleProcesses) {
    try {
      process.kill(entry.pid, "SIGTERM");
    } catch {}
  }

  if (staleProcesses.length > 0) {
    await sleep(1_500);
  }

  for (const entry of staleProcesses) {
    try {
      process.kill(entry.pid, 0);
      process.kill(entry.pid, "SIGKILL");
    } catch {}
  }
}

async function ensureManagedPortsAreFree() {
  const managedPorts = [3000, 4000, 4100];
  const blockers: Array<{ port: number; pid: number; command: string }> = [];

  for (const port of managedPorts) {
    for (const pid of listListeningPids(port)) {
      const command = readProcessCommand(pid);
      if (isFyxvoDevCommand(command)) {
        try {
          process.kill(pid, "SIGTERM");
        } catch {}
        continue;
      }

      blockers.push({ port, pid, command });
    }
  }

  if (blockers.length > 0) {
    throw new Error(
      blockers
        .map(
          (blocker) =>
            `Port ${blocker.port} is already in use by PID ${blocker.pid}: ${blocker.command || "unknown process"}`
        )
        .join("\n")
    );
  }

  await sleep(1_000);
}

function prefixStream(name: string, stream: NodeJS.ReadableStream, isError = false) {
  const reader = createInterface({ input: stream });
  reader.on("line", (line) => {
    const target = isError ? process.stderr : process.stdout;
    target.write(`[${name}] ${line}\n`);
  });
}

function spawnCommand(
  name: string,
  args: string[],
  options: {
    readonly longRunning?: boolean;
  } = {}
) {
  const child = spawn("pnpm", args, {
    cwd: process.cwd(),
    env: runtimeEnv,
    stdio: ["ignore", "pipe", "pipe"]
  });

  if (!child.stdout || !child.stderr) {
    throw new Error(`Unable to capture output for ${name}.`);
  }

  prefixStream(name, child.stdout);
  prefixStream(name, child.stderr, true);

  if (options.longRunning) {
    longRunningChildren.push(child);
    child.on("exit", (code, signal) => {
      if (shuttingDown) {
        return;
      }

      if (signal || code) {
        process.stderr.write(
          `[${name}] exited unexpectedly with ${signal ? `signal ${signal}` : `code ${code}`}\n`
        );
        shutdown(1);
      }
    });
    return child;
  }

  return new Promise<void>((resolve, reject) => {
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${name} failed with exit code ${code ?? 1}.`));
    });
  });
}

function spawnProcess(name: string, command: string, args: string[]) {
  const child = spawn(command, args, {
    cwd: process.cwd(),
    env: runtimeEnv,
    stdio: ["ignore", "pipe", "pipe"]
  });

  if (!child.stdout || !child.stderr) {
    throw new Error(`Unable to capture output for ${name}.`);
  }

  prefixStream(name, child.stdout);
  prefixStream(name, child.stderr, true);

  return new Promise<void>((resolve, reject) => {
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${name} failed with exit code ${code ?? 1}.`));
    });
  });
}

function runProcess(command: string, args: string[]) {
  const child = spawn(command, args, {
    cwd: process.cwd(),
    env: runtimeEnv,
    stdio: ["ignore", "pipe", "pipe"]
  });

  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr?.on("data", (chunk) => {
      stderr += String(chunk);
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      reject(new Error(stderr || stdout || `${command} exited with code ${code ?? 1}.`));
    });
  });
}

async function waitForHttp(url: string, label: string) {
  const deadline = Date.now() + 90_000;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok || response.status < 500) {
        return;
      }
    } catch {}

    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }

  throw new Error(`${label} did not become ready at ${url}.`);
}

async function shutdown(exitCode = 0) {
  shuttingDown = true;
  for (const child of longRunningChildren) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 500));
  process.exit(exitCode);
}

async function waitForContainerHealth(service: string) {
  const deadline = Date.now() + 90_000;

  while (Date.now() < deadline) {
    try {
      const { stdout } = await runProcess("docker", ["compose", "ps", "--format", "json", service]);
      const normalized = stdout.trim();
      if (!normalized) {
        throw new Error(`No container output for ${service}.`);
      }

      const entries = normalized.startsWith("[")
        ? (JSON.parse(normalized) as Array<{ Health?: string; State?: string }>)
        : normalized
            .split("\n")
            .filter((line) => line.trim().length > 0)
            .map((line) => JSON.parse(line) as { Health?: string; State?: string });
      const entry = entries[0];

      if (entry?.Health === "healthy" || entry?.State === "running") {
        return;
      }
    } catch {}

    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }

  throw new Error(`${service} did not reach a healthy state in time.`);
}

async function ensureInfrastructure() {
  await spawnProcess("infra", "docker", ["compose", "up", "-d", "postgres", "redis"]);
  await waitForContainerHealth("postgres");
  await waitForContainerHealth("redis");
}

async function main() {
  process.on("SIGINT", () => {
    void shutdown(0);
  });
  process.on("SIGTERM", () => {
    void shutdown(0);
  });

  await cleanupStaleFyxvoProcesses();
  await ensureManagedPortsAreFree();
  await ensureInfrastructure();
  await spawnCommand("packages:config", ["--filter", "@fyxvo/config", "build"]);
  await spawnCommand("packages:database", ["--filter", "@fyxvo/database", "build"]);
  await spawnCommand("packages:ui", ["--filter", "@fyxvo/ui", "build"]);
  await spawnCommand("packages:sdk", ["--filter", "@fyxvo/sdk", "build"]);
  await spawnCommand("database:migrate", ["--filter", "@fyxvo/database", "migrate:deploy"]);
  await spawnCommand("provision", ["exec", "tsx", "scripts/provision-dev-stack.ts"]);

  for (const service of services) {
    spawnCommand(service.name, ["--filter", service.filter, "dev"], {
      longRunning: true
    });
  }

  await Promise.all(
    services
      .filter((service) => service.readyUrl)
      .map((service) => waitForHttp(service.readyUrl!, service.name))
  );

  process.stdout.write(
    [
      "[fyxvo] full stack ready",
      "[fyxvo] web http://localhost:3000",
      "[fyxvo] api http://localhost:4000/health",
      "[fyxvo] gateway http://localhost:4100/health"
    ].join("\n") + "\n"
  );
}

main().catch(async (error: unknown) => {
  console.error(error);
  await shutdown(1);
});
