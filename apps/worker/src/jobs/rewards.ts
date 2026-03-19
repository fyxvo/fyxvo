import type { WorkerEnv } from "@fyxvo/config";
import type { RewardComputationInput, WorkerJobResult, WorkerLogger, WorkerRepository } from "../types.js";
import { workerJobNames } from "../types.js";

function resolveRewardWindow(now: Date, windowMinutes: number) {
  const currentBoundary = new Date(now);
  currentBoundary.setUTCSeconds(0, 0);
  const minute = currentBoundary.getUTCMinutes();
  const flooredMinute = minute - (minute % windowMinutes);
  currentBoundary.setUTCMinutes(flooredMinute, 0, 0);

  const windowEnd = currentBoundary;
  const windowStart = new Date(windowEnd.getTime() - windowMinutes * 60_000);

  return { windowStart, windowEnd };
}

function calculateRewardLamports(
  input: Pick<RewardComputationInput, "requestCount" | "uptimeRatio" | "reputationScore">,
  lamportsPerRequest: number
): bigint {
  return BigInt(
    Math.max(
      0,
      Math.round(
        input.requestCount * lamportsPerRequest * input.uptimeRatio * input.reputationScore
      )
    )
  );
}

export async function processRewardCalculation(input: {
  readonly env: WorkerEnv;
  readonly repository: WorkerRepository;
  readonly logger: WorkerLogger;
  readonly now?: Date;
}): Promise<WorkerJobResult> {
  const { windowStart, windowEnd } = resolveRewardWindow(
    input.now ?? new Date(),
    input.env.WORKER_REWARD_WINDOW_MINUTES
  );
  const rewards = await input.repository.listRewardInputs({
    windowStart,
    windowEnd
  });

  let totalRewardsLamports = 0n;
  for (const reward of rewards) {
    const rewardLamports = calculateRewardLamports(
      reward,
      input.env.WORKER_REWARD_LAMPORTS_PER_REQUEST
    );
    totalRewardsLamports += rewardLamports;

    await input.repository.upsertRewardSnapshot({
      ...reward,
      rewardLamports,
      windowStart,
      windowEnd
    });
  }

  input.logger.info(
    {
      rewardCount: rewards.length,
      totalRewardsLamports: totalRewardsLamports.toString(),
      windowStart: windowStart.toISOString(),
      windowEnd: windowEnd.toISOString()
    },
    "Reward calculation completed"
  );

  return {
    job: workerJobNames.rewardCalculation,
    processed: rewards.length,
    details: {
      windowStart: windowStart.toISOString(),
      windowEnd: windowEnd.toISOString(),
      totalRewardsLamports: totalRewardsLamports.toString()
    }
  };
}
