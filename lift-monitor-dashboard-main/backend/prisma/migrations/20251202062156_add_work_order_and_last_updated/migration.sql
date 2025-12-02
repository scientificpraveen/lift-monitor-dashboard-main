-- AlterTable
ALTER TABLE "service_logs" ADD COLUMN     "lastUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "lastUpdatedBy" TEXT,
ADD COLUMN     "workOrderNo" TEXT;
