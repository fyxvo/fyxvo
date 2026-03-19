ALTER TABLE "NodeOperator"
ADD COLUMN "reputationScore" DOUBLE PRECISION NOT NULL DEFAULT 1;

ALTER TABLE "Node"
ADD COLUMN "reliabilityScore" DOUBLE PRECISION NOT NULL DEFAULT 1;

CREATE TABLE "WorkerCursor" (
    "key" TEXT NOT NULL,
    "cursorValue" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkerCursor_pkey" PRIMARY KEY ("key")
);

CREATE TABLE "ProjectUsageRollup" (
    "id" UUID NOT NULL,
    "projectId" UUID,
    "service" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "windowEnd" TIMESTAMP(3) NOT NULL,
    "requestCount" INTEGER NOT NULL,
    "successCount" INTEGER NOT NULL,
    "errorCount" INTEGER NOT NULL,
    "totalDurationMs" INTEGER NOT NULL,
    "averageLatencyMs" INTEGER NOT NULL,
    "lastRequestAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectUsageRollup_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WalletActivity" (
    "id" UUID NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "slot" BIGINT NOT NULL,
    "blockTime" TIMESTAMP(3),
    "success" BOOLEAN NOT NULL,
    "projectId" UUID,
    "source" TEXT NOT NULL,
    "raw" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WalletActivity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WalletTokenBalance" (
    "id" UUID NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "mintAddress" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "decimals" INTEGER NOT NULL,
    "projectId" UUID,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletTokenBalance_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TransactionLookup" (
    "id" UUID NOT NULL,
    "signature" TEXT NOT NULL,
    "slot" BIGINT NOT NULL,
    "status" TEXT NOT NULL,
    "blockTime" TIMESTAMP(3),
    "raw" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransactionLookup_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NodeHealthCheck" (
    "id" UUID NOT NULL,
    "nodeId" UUID NOT NULL,
    "isHealthy" BOOLEAN NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "responseSlot" BIGINT,
    "errorMessage" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NodeHealthCheck_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OperatorRewardSnapshot" (
    "id" UUID NOT NULL,
    "operatorId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "requestCount" INTEGER NOT NULL,
    "uptimeRatio" DOUBLE PRECISION NOT NULL,
    "reputationScore" DOUBLE PRECISION NOT NULL,
    "rewardLamports" BIGINT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "windowEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperatorRewardSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProjectUsageRollup_projectId_service_windowStart_windowEnd_key" ON "ProjectUsageRollup"("projectId", "service", "windowStart", "windowEnd");
CREATE INDEX "ProjectUsageRollup_service_windowStart_idx" ON "ProjectUsageRollup"("service", "windowStart");

CREATE UNIQUE INDEX "WalletActivity_walletAddress_signature_key" ON "WalletActivity"("walletAddress", "signature");
CREATE INDEX "WalletActivity_walletAddress_blockTime_idx" ON "WalletActivity"("walletAddress", "blockTime");
CREATE INDEX "WalletActivity_projectId_blockTime_idx" ON "WalletActivity"("projectId", "blockTime");

CREATE UNIQUE INDEX "WalletTokenBalance_walletAddress_mintAddress_key" ON "WalletTokenBalance"("walletAddress", "mintAddress");
CREATE INDEX "WalletTokenBalance_projectId_walletAddress_idx" ON "WalletTokenBalance"("projectId", "walletAddress");

CREATE UNIQUE INDEX "TransactionLookup_signature_key" ON "TransactionLookup"("signature");

CREATE INDEX "NodeHealthCheck_nodeId_checkedAt_idx" ON "NodeHealthCheck"("nodeId", "checkedAt");

CREATE UNIQUE INDEX "OperatorRewardSnapshot_operatorId_projectId_windowStart_windowEnd_key" ON "OperatorRewardSnapshot"("operatorId", "projectId", "windowStart", "windowEnd");
CREATE INDEX "OperatorRewardSnapshot_projectId_windowEnd_idx" ON "OperatorRewardSnapshot"("projectId", "windowEnd");

ALTER TABLE "ProjectUsageRollup"
ADD CONSTRAINT "ProjectUsageRollup_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WalletActivity"
ADD CONSTRAINT "WalletActivity_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "NodeHealthCheck"
ADD CONSTRAINT "NodeHealthCheck_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "Node"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OperatorRewardSnapshot"
ADD CONSTRAINT "OperatorRewardSnapshot_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "NodeOperator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OperatorRewardSnapshot"
ADD CONSTRAINT "OperatorRewardSnapshot_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
