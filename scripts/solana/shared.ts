import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import {
  FYXVO_DEVNET_ADMIN_AUTHORITY,
  FYXVO_DEVNET_USDC_MINT_ADDRESS,
  anchorInstructionDiscriminator,
  deriveFyxvoProtocolAddresses,
  encodeU64,
  fetchFyxvoProtocolReadiness,
  fyxvoProgramSeeds,
  formatFyxvoProtocolReadiness,
  getSolanaNetworkConfig,
  loadSharedEnv
} from "@fyxvo/config";
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction
} from "@solana/web3.js";
import { sendAndConfirmTransaction } from "@solana/web3.js";

export interface SolanaScriptRuntime {
  readonly rpcUrl: string;
  readonly wsUrl: string;
  readonly programId: string;
  readonly adminAuthority: string;
  readonly usdcMintAddress: string;
  readonly feeBps: number;
  readonly usdcEnabled: boolean;
  readonly anchorWalletPath: string;
  readonly programKeypairPath: string;
  readonly managedOperatorKeypairPath: string;
  readonly gatewayUpstreamRpcUrls: readonly string[];
}

export function resolveHomePath(value: string): string {
  if (value.startsWith("~/")) {
    return path.join(os.homedir(), value.slice(2));
  }

  return value;
}

export function loadSolanaScriptRuntime(
  source: Record<string, string | undefined> = process.env
): SolanaScriptRuntime {
  const shared = loadSharedEnv(source);
  const network = getSolanaNetworkConfig(shared.SOLANA_CLUSTER);

  return {
    rpcUrl: shared.SOLANA_RPC_URL,
    wsUrl: shared.SOLANA_WS_URL,
    programId: shared.FYXVO_PROGRAM_ID,
    adminAuthority: shared.FYXVO_ADMIN_AUTHORITY,
    usdcMintAddress:
      source.USDC_MINT_ADDRESS?.trim().length ? source.USDC_MINT_ADDRESS : FYXVO_DEVNET_USDC_MINT_ADDRESS,
    feeBps: shared.FYXVO_PROTOCOL_FEE_BPS,
    usdcEnabled: shared.FYXVO_ENABLE_USDC,
    anchorWalletPath: resolveHomePath(source.ANCHOR_WALLET ?? "~/.config/solana/id.json"),
    programKeypairPath: resolveHomePath(
      source.FYXVO_PROGRAM_KEYPAIR_PATH ?? path.join(process.cwd(), "target/deploy/fyxvo-keypair.json")
    ),
    managedOperatorKeypairPath: resolveHomePath(
      source.FYXVO_MANAGED_OPERATOR_KEYPAIR_PATH ?? "~/.config/fyxvo/devnet-managed-operator.json"
    ),
    gatewayUpstreamRpcUrls:
      source.GATEWAY_UPSTREAM_RPC_URLS?.split(",")
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0) ?? [network.rpcUrl]
  };
}

export function createDevnetConnection(runtime: SolanaScriptRuntime) {
  return new Connection(runtime.rpcUrl, "confirmed");
}

export async function loadKeypairFromFile(filePath: string): Promise<Keypair> {
  const contents = await readFile(filePath, "utf8");
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(contents) as number[]));
}

export async function saveKeypairToFile(filePath: string, keypair: Keypair): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true, mode: 0o700 });
  await writeFile(filePath, JSON.stringify(Array.from(keypair.secretKey)), { mode: 0o600 });
}

export async function ensureKeypair(filePath: string, options: {
  readonly createIfMissing?: boolean;
} = {}): Promise<Keypair> {
  try {
    return await loadKeypairFromFile(filePath);
  } catch (error) {
    if (!options.createIfMissing) {
      throw error;
    }

    const keypair = Keypair.generate();
    await saveKeypairToFile(filePath, keypair);
    return keypair;
  }
}

export async function runCommand(
  command: string,
  args: readonly string[],
  env: NodeJS.ProcessEnv = process.env
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, [...args], {
      cwd: process.cwd(),
      env,
      stdio: "inherit"
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} exited with code ${code ?? 1}.`));
    });
    child.on("error", reject);
  });
}

export function serializeForJson<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, candidate) =>
      typeof candidate === "bigint" ? candidate.toString() : candidate
    )
  ) as T;
}

export function formatSol(lamports: number): string {
  return `${(lamports / LAMPORTS_PER_SOL).toFixed(4)} SOL`;
}

export async function getWalletBalance(connection: Connection, publicKey: PublicKey) {
  return connection.getBalance(publicKey, "confirmed");
}

export async function topUpWalletIfNeeded(input: {
  readonly connection: Connection;
  readonly payer: Keypair;
  readonly recipient: PublicKey;
  readonly minimumLamports: number;
  readonly targetLamports?: number;
}) {
  const currentBalance = await getWalletBalance(input.connection, input.recipient);
  if (currentBalance >= input.minimumLamports) {
    return {
      funded: false,
      currentBalance,
      targetBalance: input.targetLamports ?? input.minimumLamports
    } as const;
  }

  const targetBalance = input.targetLamports ?? input.minimumLamports;
  const lamports = Math.max(targetBalance - currentBalance, 1);
  const signature = await sendAndConfirmTransaction(
    input.connection,
    new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: input.payer.publicKey,
        toPubkey: input.recipient,
        lamports
      })
    ),
    [input.payer],
    {
      commitment: "confirmed"
    }
  );

  const finalBalance = await getWalletBalance(input.connection, input.recipient);
  return {
    funded: true,
    signature,
    currentBalance: finalBalance,
    targetBalance
  } as const;
}

export async function requireWalletFunding(input: {
  readonly connection: Connection;
  readonly wallet: PublicKey;
  readonly minimumLamports: number;
  readonly nextCommand: string;
}) {
  const balance = await getWalletBalance(input.connection, input.wallet);
  if (balance >= input.minimumLamports) {
    return balance;
  }

  throw new Error(
    [
      `Wallet ${input.wallet.toBase58()} has ${formatSol(balance)} on devnet.`,
      `At least ${formatSol(input.minimumLamports)} is required for the next step.`,
      `Try: solana airdrop 2 ${input.wallet.toBase58()} --url ${getSolanaNetworkConfig("devnet").rpcUrl}`,
      "If the faucet is rate limited, fund that exact wallet from https://faucet.solana.com and rerun:",
      input.nextCommand
    ].join("\n")
  );
}

export function buildInitializeProtocolInstruction(input: {
  readonly programId: PublicKey;
  readonly payer: PublicKey;
  readonly adminAuthority: PublicKey;
  readonly feeBps: number;
  readonly usdcMint: PublicKey;
}) {
  const addresses = deriveFyxvoProtocolAddresses({
    programId: input.programId,
    usdcMintAddress: input.usdcMint
  });
  const feeBps = Buffer.alloc(2);
  feeBps.writeUInt16LE(input.feeBps);

  return {
    instruction: new TransactionInstruction({
      programId: input.programId,
      keys: [
        { pubkey: input.payer, isSigner: true, isWritable: true },
        { pubkey: addresses.protocolConfig, isSigner: false, isWritable: true },
        { pubkey: addresses.treasury, isSigner: false, isWritable: true },
        { pubkey: addresses.operatorRegistry, isSigner: false, isWritable: true },
        { pubkey: input.usdcMint, isSigner: false, isWritable: false },
        { pubkey: addresses.treasuryUsdcVault!, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
      ],
      data: Buffer.concat([
        anchorInstructionDiscriminator("initialize_protocol"),
        input.adminAuthority.toBuffer(),
        feeBps
      ])
    }),
    addresses
  };
}

export function buildRegisterOperatorInstruction(input: {
  readonly programId: PublicKey;
  readonly operator: PublicKey;
  readonly project: PublicKey;
}) {
  const protocolAddresses = deriveFyxvoProtocolAddresses({
    programId: input.programId,
    usdcMintAddress: FYXVO_DEVNET_USDC_MINT_ADDRESS
  });
  const operatorAccount = PublicKey.findProgramAddressSync(
    [fyxvoProgramSeeds.operator, input.project.toBuffer(), input.operator.toBuffer()],
    input.programId
  )[0];
  const rewardAccount = PublicKey.findProgramAddressSync(
    [fyxvoProgramSeeds.reward, operatorAccount.toBuffer()],
    input.programId
  )[0];

  return {
    instruction: new TransactionInstruction({
      programId: input.programId,
      keys: [
        { pubkey: input.operator, isSigner: true, isWritable: true },
        { pubkey: protocolAddresses.protocolConfig, isSigner: false, isWritable: false },
        { pubkey: protocolAddresses.operatorRegistry, isSigner: false, isWritable: true },
        { pubkey: input.project, isSigner: false, isWritable: false },
        { pubkey: operatorAccount, isSigner: false, isWritable: true },
        { pubkey: rewardAccount, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
      ],
      data: anchorInstructionDiscriminator("register_operator")
    }),
    protocolAddresses,
    operatorAccount,
    rewardAccount
  };
}

export function deriveProjectAddress(input: {
  readonly programId: string | PublicKey;
  readonly owner: string | PublicKey;
  readonly chainProjectId: bigint;
}) {
  const programId = input.programId instanceof PublicKey ? input.programId : new PublicKey(input.programId);
  const owner = input.owner instanceof PublicKey ? input.owner : new PublicKey(input.owner);

  return PublicKey.findProgramAddressSync(
    [fyxvoProgramSeeds.project, owner.toBuffer(), encodeU64(input.chainProjectId)],
    programId
  )[0];
}

export async function fetchReadiness(runtime: SolanaScriptRuntime, connection: Connection) {
  return fetchFyxvoProtocolReadiness({
    connection,
    programId: runtime.programId,
    expectedAdminAuthority: runtime.adminAuthority,
    expectedUsdcMint: runtime.usdcMintAddress
  });
}

export function printReadiness(readiness: Awaited<ReturnType<typeof fetchReadiness>>) {
  process.stdout.write(`${formatFyxvoProtocolReadiness(readiness)}\n`);
  process.stdout.write(`${JSON.stringify(serializeForJson(readiness), null, 2)}\n`);
}

export function getStringFlag(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  if (index < 0) {
    return undefined;
  }

  return process.argv[index + 1];
}

export async function ensureProgramKeypair(runtime: SolanaScriptRuntime, options: {
  readonly createIfMissing?: boolean;
} = {}) {
  const keypair = await ensureKeypair(runtime.programKeypairPath, options);
  return {
    keypair,
    programId: keypair.publicKey.toBase58()
  };
}

export function createAnchorCliEnv(runtime: SolanaScriptRuntime): NodeJS.ProcessEnv {
  return {
    ...process.env,
    ANCHOR_WALLET: runtime.anchorWalletPath,
    ANCHOR_PROVIDER_URL: runtime.rpcUrl,
    SOLANA_URL: runtime.rpcUrl
  };
}

export function buildSyncTargets(programId: string) {
  return [
    {
      filePath: path.join(process.cwd(), "programs/fyxvo/src/lib.rs"),
      pattern: /declare_id!\("([A-Za-z0-9]+)"\);/,
      replacement: `declare_id!("${programId}");`
    },
    {
      filePath: path.join(process.cwd(), "Anchor.toml"),
      pattern: /(\[programs\.localnet\]\s*fyxvo\s*=\s*")([A-Za-z0-9]+)(")/,
      replacement: `$1${programId}$3`
    },
    {
      filePath: path.join(process.cwd(), "Anchor.toml"),
      pattern: /(\[programs\.devnet\]\s*fyxvo\s*=\s*")([A-Za-z0-9]+)(")/,
      replacement: `$1${programId}$3`
    },
    {
      filePath: path.join(process.cwd(), "packages/config/src/solana.ts"),
      pattern: /(fyxvo:\s*")([A-Za-z0-9]+)(")/,
      replacement: `$1${programId}$3`
    }
  ] as const;
}

export async function syncProgramIdInRepo(programId: string) {
  for (const target of buildSyncTargets(programId)) {
    const current = await readFile(target.filePath, "utf8");
    const next = current.replace(target.pattern, target.replacement);
    if (next !== current) {
      await writeFile(target.filePath, next);
    }
  }
}

export const DEFAULT_DEVNET_DEPLOY_COMMAND = "pnpm solana:program:deploy:devnet";
export const DEFAULT_DEVNET_INIT_COMMAND = "pnpm solana:protocol:init";
export const DEFAULT_DEVNET_VERIFY_COMMAND = "pnpm solana:protocol:verify";
export const DEFAULT_DEVNET_PRINT_COMMAND = "pnpm solana:protocol:addresses";
export const DEFAULT_DEVNET_OPERATOR_COMMAND = "pnpm solana:protocol:seed-managed-operator";
export const DEFAULT_PROTOCOL_ADMIN_AUTHORITY = FYXVO_DEVNET_ADMIN_AUTHORITY;
