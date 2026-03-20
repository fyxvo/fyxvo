-- Add notification preference fields to User
ALTER TABLE "User"
  ADD COLUMN "notifyProjectActivation"  BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "notifyApiKeyEvents"        BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "notifyFundingConfirmed"    BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "notifyLowBalance"          BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "notifyDailyAlert"          BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "notifyWeeklySummary"       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "notifyReferralConversion"  BOOLEAN NOT NULL DEFAULT true;

-- Add public visibility fields to Project
ALTER TABLE "Project"
  ADD COLUMN "isPublic"   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "publicSlug" TEXT;

CREATE UNIQUE INDEX "Project_publicSlug_key" ON "Project"("publicSlug");
CREATE INDEX "Project_publicSlug_idx" ON "Project"("publicSlug");

-- Webhook table
CREATE TABLE "Webhook" (
  "id"              UUID        NOT NULL DEFAULT gen_random_uuid(),
  "projectId"       UUID        NOT NULL,
  "url"             TEXT        NOT NULL,
  "events"          JSONB       NOT NULL,
  "secret"          TEXT        NOT NULL,
  "active"          BOOLEAN     NOT NULL DEFAULT true,
  "lastTriggeredAt" TIMESTAMP(3),
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Webhook_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Webhook_projectId_idx" ON "Webhook"("projectId");

ALTER TABLE "Webhook" ADD CONSTRAINT "Webhook_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ProjectMember table
CREATE TABLE "ProjectMember" (
  "id"         UUID         NOT NULL DEFAULT gen_random_uuid(),
  "projectId"  UUID         NOT NULL,
  "userId"     UUID         NOT NULL,
  "role"       TEXT         NOT NULL DEFAULT 'member',
  "invitedBy"  UUID,
  "invitedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "acceptedAt" TIMESTAMP(3),
  CONSTRAINT "ProjectMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProjectMember_projectId_userId_key" ON "ProjectMember"("projectId", "userId");
CREATE INDEX "ProjectMember_projectId_idx" ON "ProjectMember"("projectId");
CREATE INDEX "ProjectMember_userId_idx" ON "ProjectMember"("userId");

ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- EnterpriseInterest table
CREATE TABLE "EnterpriseInterest" (
  "id"                   UUID         NOT NULL DEFAULT gen_random_uuid(),
  "companyName"          TEXT         NOT NULL,
  "contactEmail"         TEXT         NOT NULL,
  "estimatedMonthlyReqs" TEXT         NOT NULL,
  "useCase"              TEXT         NOT NULL,
  "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EnterpriseInterest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EnterpriseInterest_createdAt_idx" ON "EnterpriseInterest"("createdAt");
