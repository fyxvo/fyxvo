CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "UserRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER');
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INVITED', 'DISABLED');
CREATE TYPE "ApiKeyStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');
CREATE TYPE "NodeOperatorStatus" AS ENUM ('ACTIVE', 'ONBOARDING', 'SUSPENDED');
CREATE TYPE "NodeStatus" AS ENUM ('PROVISIONING', 'ONLINE', 'DEGRADED', 'OFFLINE', 'DECOMMISSIONED');
CREATE TYPE "NodeNetwork" AS ENUM ('DEVNET', 'TESTNET', 'MAINNET');

CREATE TABLE "User" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "email" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'MEMBER',
  "status" "UserStatus" NOT NULL DEFAULT 'INVITED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Project" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "ownerId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ApiKey" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "projectId" UUID NOT NULL,
  "createdById" UUID NOT NULL,
  "label" TEXT NOT NULL,
  "prefix" TEXT NOT NULL,
  "keyHash" TEXT NOT NULL,
  "status" "ApiKeyStatus" NOT NULL DEFAULT 'ACTIVE',
  "scopes" JSONB NOT NULL,
  "lastUsedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RequestLog" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "requestId" TEXT,
  "projectId" UUID,
  "apiKeyId" UUID,
  "userId" UUID,
  "service" TEXT NOT NULL,
  "route" TEXT NOT NULL,
  "method" TEXT NOT NULL,
  "statusCode" INTEGER NOT NULL,
  "durationMs" INTEGER NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RequestLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NodeOperator" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "walletAddress" TEXT NOT NULL,
  "status" "NodeOperatorStatus" NOT NULL DEFAULT 'ONBOARDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NodeOperator_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Node" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "operatorId" UUID NOT NULL,
  "projectId" UUID,
  "name" TEXT NOT NULL,
  "network" "NodeNetwork" NOT NULL DEFAULT 'DEVNET',
  "endpoint" TEXT NOT NULL,
  "region" TEXT NOT NULL,
  "status" "NodeStatus" NOT NULL DEFAULT 'PROVISIONING',
  "lastHeartbeatAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Node_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Metrics" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "nodeId" UUID NOT NULL,
  "cpuUsage" DOUBLE PRECISION NOT NULL,
  "memoryUsage" DOUBLE PRECISION NOT NULL,
  "diskUsage" DOUBLE PRECISION NOT NULL,
  "requestCount" INTEGER NOT NULL,
  "errorRate" DOUBLE PRECISION NOT NULL,
  "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Metrics_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");
CREATE UNIQUE INDEX "ApiKey_prefix_key" ON "ApiKey"("prefix");
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");
CREATE UNIQUE INDEX "RequestLog_requestId_key" ON "RequestLog"("requestId");
CREATE UNIQUE INDEX "NodeOperator_email_key" ON "NodeOperator"("email");
CREATE UNIQUE INDEX "NodeOperator_walletAddress_key" ON "NodeOperator"("walletAddress");
CREATE UNIQUE INDEX "Node_endpoint_key" ON "Node"("endpoint");

CREATE INDEX "Project_ownerId_idx" ON "Project"("ownerId");
CREATE INDEX "ApiKey_projectId_idx" ON "ApiKey"("projectId");
CREATE INDEX "ApiKey_createdById_idx" ON "ApiKey"("createdById");
CREATE INDEX "RequestLog_projectId_createdAt_idx" ON "RequestLog"("projectId", "createdAt");
CREATE INDEX "RequestLog_apiKeyId_createdAt_idx" ON "RequestLog"("apiKeyId", "createdAt");
CREATE INDEX "RequestLog_userId_createdAt_idx" ON "RequestLog"("userId", "createdAt");
CREATE INDEX "RequestLog_service_route_createdAt_idx" ON "RequestLog"("service", "route", "createdAt");
CREATE INDEX "Node_operatorId_idx" ON "Node"("operatorId");
CREATE INDEX "Node_projectId_idx" ON "Node"("projectId");
CREATE INDEX "Node_network_status_idx" ON "Node"("network", "status");
CREATE INDEX "Metrics_nodeId_recordedAt_idx" ON "Metrics"("nodeId", "recordedAt");

ALTER TABLE "Project"
  ADD CONSTRAINT "Project_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ApiKey"
  ADD CONSTRAINT "ApiKey_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ApiKey"
  ADD CONSTRAINT "ApiKey_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "RequestLog"
  ADD CONSTRAINT "RequestLog_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RequestLog"
  ADD CONSTRAINT "RequestLog_apiKeyId_fkey"
  FOREIGN KEY ("apiKeyId") REFERENCES "ApiKey"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RequestLog"
  ADD CONSTRAINT "RequestLog_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Node"
  ADD CONSTRAINT "Node_operatorId_fkey"
  FOREIGN KEY ("operatorId") REFERENCES "NodeOperator"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Node"
  ADD CONSTRAINT "Node_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Metrics"
  ADD CONSTRAINT "Metrics_nodeId_fkey"
  FOREIGN KEY ("nodeId") REFERENCES "Node"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
