import { createHash } from "node:crypto";

export const fyxvoProgramSeeds = {
  protocolConfig: Buffer.from("protocol-config"),
  treasury: Buffer.from("treasury"),
  operatorRegistry: Buffer.from("operator-registry"),
  project: Buffer.from("project"),
  operator: Buffer.from("operator"),
  reward: Buffer.from("reward")
} as const;

export function anchorInstructionDiscriminator(name: string): Buffer {
  return createHash("sha256").update(`global:${name}`).digest().subarray(0, 8);
}

export function anchorAccountDiscriminator(name: string): Buffer {
  return createHash("sha256").update(`account:${name}`).digest().subarray(0, 8);
}

export function encodeU64(value: bigint): Buffer {
  const output = Buffer.alloc(8);
  output.writeBigUInt64LE(value);
  return output;
}

export function readU64Le(data: Buffer, offset: number): bigint {
  return data.readBigUInt64LE(offset);
}

const projectAccountDiscriminator = anchorAccountDiscriminator("ProjectAccount");

export interface FyxvoProjectFundingState {
  readonly totalSolFunded: bigint;
  readonly totalUsdcFunded: bigint;
  readonly availableSolCredits: bigint;
  readonly availableUsdcCredits: bigint;
  readonly outstandingSolRewards: bigint;
  readonly outstandingUsdcRewards: bigint;
  readonly totalSolRewardsAccrued: bigint;
  readonly totalUsdcRewardsAccrued: bigint;
}

export function decodeFyxvoProjectFundingState(data: Buffer): FyxvoProjectFundingState {
  if (data.length < 177) {
    throw new Error("Project account data is too short to decode.");
  }

  if (!data.subarray(0, 8).equals(projectAccountDiscriminator)) {
    throw new Error("Project account discriminator does not match Fyxvo ProjectAccount.");
  }

  return {
    totalSolFunded: readU64Le(data, 112),
    totalUsdcFunded: readU64Le(data, 120),
    availableSolCredits: readU64Le(data, 128),
    availableUsdcCredits: readU64Le(data, 136),
    outstandingSolRewards: readU64Le(data, 144),
    outstandingUsdcRewards: readU64Le(data, 152),
    totalSolRewardsAccrued: readU64Le(data, 160),
    totalUsdcRewardsAccrued: readU64Le(data, 168)
  };
}
