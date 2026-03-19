CREATE TYPE "InterestSubmissionStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'ARCHIVED');

CREATE TABLE "InterestSubmission" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "team" TEXT,
    "useCase" TEXT NOT NULL,
    "expectedRequestVolume" TEXT NOT NULL,
    "interestAreas" JSONB NOT NULL,
    "operatorInterest" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT NOT NULL DEFAULT 'web',
    "status" "InterestSubmissionStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterestSubmission_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InterestSubmission_email_createdAt_idx" ON "InterestSubmission"("email", "createdAt");
CREATE INDEX "InterestSubmission_status_createdAt_idx" ON "InterestSubmission"("status", "createdAt");
