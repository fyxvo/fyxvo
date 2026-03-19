ALTER TABLE "FundingCoordinate"
ADD COLUMN "transactionSignature" TEXT,
ADD COLUMN "confirmedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "FundingCoordinate_transactionSignature_key"
ON "FundingCoordinate"("transactionSignature");
