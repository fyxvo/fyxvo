-- CreateTable
CREATE TABLE "ServiceHealthSnapshot" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "serviceName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "responseTimeMs" INTEGER,
    "errorMessage" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceHealthSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ServiceHealthSnapshot_serviceName_checkedAt_idx" ON "ServiceHealthSnapshot"("serviceName", "checkedAt");
