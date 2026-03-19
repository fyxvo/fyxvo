import { loadGatewayEnv } from "@fyxvo/config";
import { disconnectDatabase, NodeNetwork, NodeOperatorStatus, NodeStatus, prisma } from "@fyxvo/database";

const DEFAULT_OPERATOR_WALLET = "AUPB1S8W1jtbxo6zfRhYqXwVXvzMUk5XDzwCybKEEmYX";

async function main() {
  const env = loadGatewayEnv({
    ...process.env,
    DATABASE_URL: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/fyxvo",
    REDIS_URL: process.env.REDIS_URL ?? "redis://localhost:6379",
    WEB_ORIGIN: process.env.WEB_ORIGIN ?? "http://localhost:3000",
    GATEWAY_UPSTREAM_RPC_URLS:
      process.env.GATEWAY_UPSTREAM_RPC_URLS ?? process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com"
  });

  const operator = await prisma.nodeOperator.upsert({
    where: { email: "infrastructure@fyxvo.dev" },
    update: {
      name: "Fyxvo Infrastructure",
      walletAddress: DEFAULT_OPERATOR_WALLET,
      status: NodeOperatorStatus.ACTIVE,
      reputationScore: 1
    },
    create: {
      name: "Fyxvo Infrastructure",
      email: "infrastructure@fyxvo.dev",
      walletAddress: DEFAULT_OPERATOR_WALLET,
      status: NodeOperatorStatus.ACTIVE,
      reputationScore: 1
    }
  });

  await prisma.node.deleteMany({
    where: {
      endpoint: {
        contains: ".fyxvo.local"
      }
    }
  });

  for (const [index, endpoint] of env.GATEWAY_UPSTREAM_RPC_URLS.entries()) {
    await prisma.node.upsert({
      where: { endpoint },
      update: {
        operatorId: operator.id,
        projectId: null,
        network: NodeNetwork.DEVNET,
        region: index === 0 ? "global-primary" : `global-fallback-${index}`,
        status: NodeStatus.ONLINE,
        reliabilityScore: 1,
        lastHeartbeatAt: new Date()
      },
      create: {
        name: `fyxvo-devnet-rpc-${String(index + 1).padStart(2, "0")}`,
        operatorId: operator.id,
        projectId: null,
        network: NodeNetwork.DEVNET,
        endpoint,
        region: index === 0 ? "global-primary" : `global-fallback-${index}`,
        status: NodeStatus.ONLINE,
        reliabilityScore: 1,
        lastHeartbeatAt: new Date()
      }
    });
  }

  await prisma.node.updateMany({
    where: {
      operatorId: operator.id,
      endpoint: {
        notIn: env.GATEWAY_UPSTREAM_RPC_URLS
      }
    },
    data: {
      status: NodeStatus.OFFLINE
    }
  });

  console.log(
    JSON.stringify({
      level: "info",
      service: "fyxvo-dev-provisioner",
      message: "Development infrastructure provisioned",
      upstreams: env.GATEWAY_UPSTREAM_RPC_URLS,
      timestamp: new Date().toISOString()
    })
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDatabase(prisma);
  });
