CREATE TYPE "FeedbackCategory" AS ENUM ('BUG_REPORT', 'SUPPORT_REQUEST', 'ONBOARDING_FRICTION', 'PRODUCT_FEEDBACK');

CREATE TYPE "FeedbackSubmissionStatus" AS ENUM ('NEW', 'REVIEWING', 'FOLLOW_UP', 'CLOSED');

CREATE TABLE "FeedbackSubmission" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT,
    "team" TEXT,
    "walletAddress" TEXT,
    "projectId" UUID,
    "category" "FeedbackCategory" NOT NULL,
    "message" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'web',
    "page" TEXT,
    "status" "FeedbackSubmissionStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedbackSubmission_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FeedbackSubmission_email_createdAt_idx" ON "FeedbackSubmission"("email", "createdAt");
CREATE INDEX "FeedbackSubmission_status_createdAt_idx" ON "FeedbackSubmission"("status", "createdAt");
CREATE INDEX "FeedbackSubmission_category_createdAt_idx" ON "FeedbackSubmission"("category", "createdAt");
CREATE INDEX "FeedbackSubmission_projectId_createdAt_idx" ON "FeedbackSubmission"("projectId", "createdAt");

ALTER TABLE "FeedbackSubmission"
ADD CONSTRAINT "FeedbackSubmission_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
