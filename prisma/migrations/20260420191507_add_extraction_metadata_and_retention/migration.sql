-- AlterTable
ALTER TABLE "BodyProfile" ADD COLUMN     "extractionConfidence" DOUBLE PRECISION,
ADD COLUMN     "extractionMethod" TEXT,
ADD COLUMN     "extractionWarnings" TEXT[];

-- CreateTable
CREATE TABLE "ScanRetention" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storagePaths" TEXT[],
    "source" TEXT NOT NULL,
    "purgeBefore" TIMESTAMP(3) NOT NULL,
    "purgedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScanRetention_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScanRetention_userId_idx" ON "ScanRetention"("userId");

-- CreateIndex
CREATE INDEX "ScanRetention_purgeBefore_idx" ON "ScanRetention"("purgeBefore");

-- AddForeignKey
ALTER TABLE "ScanRetention" ADD CONSTRAINT "ScanRetention_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
