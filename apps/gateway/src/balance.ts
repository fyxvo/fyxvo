import { decodeFyxvoProjectFundingState } from "@fyxvo/config";
import { Connection, PublicKey } from "@solana/web3.js";
import { getSolanaNetworkConfig } from "@fyxvo/config";
import type { ProjectAccessContext, ProjectBalanceResolver, ProjectFundingState } from "./types.js";

export function decodeProjectFundingState(data: Buffer, projectPda: string): ProjectFundingState {
  const decoded = decodeFyxvoProjectFundingState(data);

  return {
    projectPda,
    totalSolFunded: decoded.totalSolFunded,
    totalUsdcFunded: decoded.totalUsdcFunded,
    availableSolCredits: decoded.availableSolCredits,
    availableUsdcCredits: decoded.availableUsdcCredits
  };
}

export class OnChainProjectBalanceResolver implements ProjectBalanceResolver {
  private readonly connection: Pick<Connection, "getAccountInfo">;
  private readonly cache = new Map<
    string,
    {
      readonly expiresAt: number;
      readonly state: ProjectFundingState;
    }
  >();

  constructor(input: {
    readonly rpcUrl?: string;
    readonly connection?: Pick<Connection, "getAccountInfo">;
    readonly cacheMs: number;
  }) {
    this.connection =
      input.connection ?? new Connection(input.rpcUrl ?? getSolanaNetworkConfig("devnet").rpcUrl, "confirmed");
    this.cacheMs = input.cacheMs;
  }

  private readonly cacheMs: number;

  async getProjectFundingState(project: ProjectAccessContext["project"]): Promise<ProjectFundingState> {
    const cached = this.cache.get(project.id);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.state;
    }

    const projectKey = new PublicKey(project.onChainProjectPda);
    const accountInfo = await this.connection.getAccountInfo(projectKey, "confirmed");
    if (!accountInfo) {
      throw new Error(`On-chain project account ${project.onChainProjectPda} was not found.`);
    }

    const state = decodeProjectFundingState(Buffer.from(accountInfo.data), project.onChainProjectPda);
    this.cache.set(project.id, {
      state,
      expiresAt: Date.now() + this.cacheMs
    });
    return state;
  }
}
