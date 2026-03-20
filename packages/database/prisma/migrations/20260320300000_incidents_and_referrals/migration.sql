-- Add referralCode to User
ALTER TABLE "User" ADD COLUMN "referralCode" TEXT;
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");
CREATE INDEX "User_referralCode_idx" ON "User"("referralCode");

-- Incident table for service outage tracking
CREATE TABLE "Incident" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "serviceName" TEXT NOT NULL,
  "severity" TEXT NOT NULL DEFAULT 'degraded',
  "description" TEXT NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Incident_serviceName_startedAt_idx" ON "Incident"("serviceName", "startedAt");
CREATE INDEX "Incident_resolvedAt_startedAt_idx" ON "Incident"("resolvedAt", "startedAt");

-- ReferralClick table for tracking referral conversions
CREATE TABLE "ReferralClick" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "referrerId" UUID NOT NULL,
  "clickedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "convertedToSignup" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "ReferralClick_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ReferralClick_referrerId_clickedAt_idx" ON "ReferralClick"("referrerId", "clickedAt");
ALTER TABLE "ReferralClick" ADD CONSTRAINT "ReferralClick_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
