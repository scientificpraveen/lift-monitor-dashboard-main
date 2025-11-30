/*
  Warnings:

  - Added the required column `username` to the `service_logs` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "service_logs_date_status_idx";

-- AlterTable
ALTER TABLE "service_logs" ADD COLUMN     "username" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "service_logs_date_status_username_idx" ON "service_logs"("date", "status", "username");
