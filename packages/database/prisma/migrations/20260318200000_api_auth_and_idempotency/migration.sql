ALTER TABLE "User"
  ADD COLUMN "walletAddress" TEXT,
  ADD COLUMN "authNonce" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 1;

UPDATE "User"
SET "walletAddress" = CONCAT('wallet_', REPLACE("id"::text, '-', ''));

ALTER TABLE "User"
  ALTER COLUMN "walletAddress" SET NOT NULL;

CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

ALTER TABLE "User"
  ALTER COLUMN "email" DROP NOT NULL;

ALTER TABLE "Project"
  ADD COLUMN "chainProjectId" BIGINT,
  ADD COLUMN "onChainProjectPda" TEXT;

WITH numbered_projects AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt", "id") AS project_number
  FROM "Project"
)
UPDATE "Project"
SET
  "chainProjectId" = numbered_projects.project_number,
  "onChainProjectPda" = CONCAT('project_pda_', numbered_projects.project_number)
FROM numbered_projects
WHERE "Project"."id" = numbered_projects."id";

ALTER TABLE "Project"
  ALTER COLUMN "chainProjectId" SET NOT NULL,
  ALTER COLUMN "onChainProjectPda" SET NOT NULL;

CREATE UNIQUE INDEX "Project_chainProjectId_key" ON "Project"("chainProjectId");
CREATE UNIQUE INDEX "Project_onChainProjectPda_key" ON "Project"("onChainProjectPda");

ALTER TABLE "RequestLog"
  ADD COLUMN "idempotencyKey" TEXT;

CREATE INDEX "RequestLog_idempotencyKey_idx" ON "RequestLog"("idempotencyKey");

CREATE TABLE "FundingCoordinate" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "projectId" UUID NOT NULL,
  "requestedById" UUID NOT NULL,
  "asset" TEXT NOT NULL,
  "amount" BIGINT NOT NULL,
  "recentBlockhash" TEXT NOT NULL,
  "transactionBase64" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FundingCoordinate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IdempotencyRecord" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "key" TEXT NOT NULL,
  "route" TEXT NOT NULL,
  "method" TEXT NOT NULL,
  "actorKey" TEXT NOT NULL,
  "requestHash" TEXT NOT NULL,
  "statusCode" INTEGER NOT NULL,
  "responseBody" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "IdempotencyRecord_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FundingCoordinate_idempotencyKey_key" ON "FundingCoordinate"("idempotencyKey");
CREATE INDEX "FundingCoordinate_projectId_createdAt_idx" ON "FundingCoordinate"("projectId", "createdAt");
CREATE INDEX "FundingCoordinate_requestedById_createdAt_idx" ON "FundingCoordinate"("requestedById", "createdAt");

CREATE UNIQUE INDEX "IdempotencyRecord_key_method_route_actorKey_key"
  ON "IdempotencyRecord"("key", "method", "route", "actorKey");
CREATE INDEX "IdempotencyRecord_expiresAt_idx" ON "IdempotencyRecord"("expiresAt");

ALTER TABLE "FundingCoordinate"
  ADD CONSTRAINT "FundingCoordinate_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FundingCoordinate"
  ADD CONSTRAINT "FundingCoordinate_requestedById_fkey"
  FOREIGN KEY ("requestedById") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
