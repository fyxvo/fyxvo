import process from "node:process";
import { PublicKey, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import {
  NodeNetwork,
  NodeOperatorStatus,
  NodeStatus,
  createPrismaClient,
  disconnectDatabase
} from "../../packages/database/src/index.ts";
import {
  buildRegisterOperatorInstruction,
  createDevnetConnection,
  deriveProjectAddress,
  ensureKeypair,
  fetchReadiness,
  formatSol,
  getStringFlag,
  getWalletBalance,
  loadKeypairFromFile,
  loadSolanaScriptRuntime,
  topUpWalletIfNeeded
} from "./shared.js";

async function syncManagedOperatorInDatabase(input: {
  readonly chainProjectId: bigint;
  readonly operatorWallet: string;
  readonly endpoint?: string;
  readonly operatorName: string;
  readonly operatorEmail: string;
  readonly nodeName: string;
  readonly region: string;
}) {
  if (!process.env.DATABASE_URL?.trim()) {
    return {
      synced: false,
      reason: "DATABASE_URL is not set, so the managed operator was only registered on chain."
    } as const;
  }

  const prisma = createPrismaClient();

  try {
    const project = await prisma.project.findUnique({
      where: {
        chainProjectId: input.chainProjectId
      },
      select: {
        id: true
      }
    });

    if (!project) {
      return {
        synced: false,
        reason: `Project row with chainProjectId=${input.chainProjectId.toString()} was not found in PostgreSQL.`
      } as const;
    }

    const operator = await prisma.nodeOperator.upsert({
      where: {
        walletAddress: input.operatorWallet
      },
      update: {
        name: input.operatorName,
        email: input.operatorEmail,
        status: NodeOperatorStatus.ACTIVE
      },
      create: {
        name: input.operatorName,
        email: input.operatorEmail,
        walletAddress: input.operatorWallet,
        status: NodeOperatorStatus.ACTIVE
      },
      select: {
        id: true
      }
    });

    let nodeId: string | null = null;
    if (input.endpoint) {
      const node = await prisma.node.upsert({
        where: {
          endpoint: input.endpoint
        },
        update: {
          operatorId: operator.id,
          projectId: project.id,
          name: input.nodeName,
          region: input.region,
          network: NodeNetwork.DEVNET,
          status: NodeStatus.ACTIVE
        },
        create: {
          operatorId: operator.id,
          projectId: project.id,
          name: input.nodeName,
          endpoint: input.endpoint,
          region: input.region,
          network: NodeNetwork.DEVNET,
          status: NodeStatus.ACTIVE
        },
        select: {
          id: true
        }
      });
      nodeId = node.id;
    }

    return {
      synced: true,
      operatorId: operator.id,
      nodeId
    } as const;
  } finally {
    await disconnectDatabase(prisma);
  }
}

async function main() {
  const runtime = loadSolanaScriptRuntime();
  const connection = createDevnetConnection(runtime);
  const readiness = await fetchReadiness(runtime, connection);
  if (!readiness.ready) {
    throw new Error(
      [
        "The protocol is not ready on devnet, so the managed operator cannot be registered yet.",
        ...readiness.reasons
      ].join("\n")
    );
  }

  const owner = getStringFlag("--project-owner") ?? process.env.FYXVO_MANAGED_PROJECT_OWNER;
  const chainProjectIdValue =
    getStringFlag("--chain-project-id") ?? process.env.FYXVO_MANAGED_CHAIN_PROJECT_ID;
  if (!owner || !chainProjectIdValue) {
    throw new Error(
      "Provide --project-owner <wallet> and --chain-project-id <number> to register the managed operator."
    );
  }

  const chainProjectId = BigInt(chainProjectIdValue);
  const endpoint = getStringFlag("--endpoint") ?? process.env.FYXVO_MANAGED_OPERATOR_ENDPOINT;
  const operatorName =
    getStringFlag("--operator-name") ??
    process.env.FYXVO_MANAGED_OPERATOR_NAME ??
    "Fyxvo Managed Devnet Operator";
  const operatorEmail =
    getStringFlag("--operator-email") ??
    process.env.FYXVO_MANAGED_OPERATOR_EMAIL ??
    "managed-operator@fyxvo.com";
  const nodeName =
    getStringFlag("--node-name") ??
    process.env.FYXVO_MANAGED_NODE_NAME ??
    "Fyxvo Managed Devnet RPC";
  const region =
    getStringFlag("--region") ??
    process.env.FYXVO_MANAGED_NODE_REGION ??
    "managed-devnet";
  const payer = await loadKeypairFromFile(runtime.anchorWalletPath);
  const operator = await ensureKeypair(runtime.managedOperatorKeypairPath, {
    createIfMissing: true
  });
  const project = deriveProjectAddress({
    programId: runtime.programId,
    owner,
    chainProjectId
  });

  const projectInfo = await connection.getAccountInfo(project, "confirmed");
  if (!projectInfo) {
    throw new Error(
      `Project ${project.toBase58()} does not exist on devnet yet. Activate the project first, then rerun this command.`
    );
  }

  const operatorBalance = await getWalletBalance(connection, operator.publicKey);
  if (operatorBalance < 100_000_000) {
    await topUpWalletIfNeeded({
      connection,
      payer,
      recipient: operator.publicKey,
      minimumLamports: 100_000_000,
      targetLamports: 150_000_000
    });
  }

  const { instruction, operatorAccount, rewardAccount } = buildRegisterOperatorInstruction({
    programId: new PublicKey(readiness.addresses.programId),
    operator: operator.publicKey,
    project
  });
  const operatorAccountInfo = await connection.getAccountInfo(operatorAccount, "confirmed");

  if (!operatorAccountInfo) {
    const signature = await sendAndConfirmTransaction(
      connection,
      new Transaction().add(instruction),
      [operator],
      {
        commitment: "confirmed"
      }
    );
    const database = await syncManagedOperatorInDatabase({
      chainProjectId,
      operatorWallet: operator.publicKey.toBase58(),
      endpoint,
      operatorName,
      operatorEmail,
      nodeName,
      region
    });
    process.stdout.write(
      JSON.stringify(
        {
          status: "registered",
          signature,
          operator: operator.publicKey.toBase58(),
          operatorAccount: operatorAccount.toBase58(),
          rewardAccount: rewardAccount.toBase58(),
          project: project.toBase58(),
          managed: true,
          operatorBalance: formatSol(await getWalletBalance(connection, operator.publicKey)),
          database
        },
        null,
        2
      ) + "\n"
    );
    return;
  }

  const database = await syncManagedOperatorInDatabase({
    chainProjectId,
    operatorWallet: operator.publicKey.toBase58(),
    endpoint,
    operatorName,
    operatorEmail,
    nodeName,
    region
  });
  process.stdout.write(
    JSON.stringify(
      {
        status: "exists",
        operator: operator.publicKey.toBase58(),
        operatorAccount: operatorAccount.toBase58(),
        rewardAccount: rewardAccount.toBase58(),
        project: project.toBase58(),
        managed: true,
        operatorBalance: formatSol(await getWalletBalance(connection, operator.publicKey)),
        database
      },
      null,
      2
    ) + "\n"
  );
}

void main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
