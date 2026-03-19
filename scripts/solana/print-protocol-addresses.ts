import process from "node:process";
import { deriveFyxvoProtocolAddresses } from "@fyxvo/config";
import {
  DEFAULT_PROTOCOL_ADMIN_AUTHORITY,
  ensureProgramKeypair,
  loadSolanaScriptRuntime
} from "./shared.js";

async function main() {
  const runtime = loadSolanaScriptRuntime();
  const { programId } = await ensureProgramKeypair(runtime, {
    createIfMissing: process.argv.includes("--generate-program-id")
  });
  const addresses = deriveFyxvoProtocolAddresses({
    programId,
    usdcMintAddress: runtime.usdcMintAddress
  });

  process.stdout.write(
    JSON.stringify(
      {
        cluster: "devnet",
        programId,
        adminAuthority: runtime.adminAuthority ?? DEFAULT_PROTOCOL_ADMIN_AUTHORITY,
        usdcMintAddress: runtime.usdcMintAddress,
        usdcEnabled: runtime.usdcEnabled,
        programKeypairPath: runtime.programKeypairPath,
        anchorWalletPath: runtime.anchorWalletPath,
        managedOperatorKeypairPath: runtime.managedOperatorKeypairPath,
        addresses: {
          protocolConfig: addresses.protocolConfig.toBase58(),
          treasury: addresses.treasury.toBase58(),
          operatorRegistry: addresses.operatorRegistry.toBase58(),
          treasuryUsdcVault: addresses.treasuryUsdcVault?.toBase58() ?? null
        }
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
