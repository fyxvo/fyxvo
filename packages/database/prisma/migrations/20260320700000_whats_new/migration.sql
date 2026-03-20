-- WhatsNew table
CREATE TABLE "WhatsNew" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WhatsNew_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "WhatsNew_active_publishedAt_idx" ON "WhatsNew"("active", "publishedAt");

-- Add whatsNewDismissedVersion to User
ALTER TABLE "User" ADD COLUMN "whatsNewDismissedVersion" TEXT;
