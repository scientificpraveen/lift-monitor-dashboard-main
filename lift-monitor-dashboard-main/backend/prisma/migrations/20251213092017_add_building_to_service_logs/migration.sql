/*
  Warnings:

  - You are about to drop the column `workOrderNo` on the `service_logs` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[building,date,time]` on the table `panel_logs` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `building` to the `service_logs` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "service_logs_date_status_username_idx";

-- AlterTable
ALTER TABLE "service_logs" DROP COLUMN "workOrderNo",
ADD COLUMN     "building" TEXT NOT NULL,
ADD COLUMN     "changeDescription" TEXT;

-- CreateTable
CREATE TABLE "service_log_history" (
    "id" SERIAL NOT NULL,
    "serviceLogId" INTEGER NOT NULL,
    "changeType" TEXT NOT NULL,
    "changeDescription" TEXT NOT NULL,
    "changedBy" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "oldValue" TEXT,
    "newValue" TEXT,

    CONSTRAINT "service_log_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "service_log_history_serviceLogId_changedAt_idx" ON "service_log_history"("serviceLogId", "changedAt");

-- CreateIndex
CREATE UNIQUE INDEX "panel_logs_building_date_time_key" ON "panel_logs"("building", "date", "time");

-- CreateIndex
CREATE INDEX "service_logs_building_date_status_username_idx" ON "service_logs"("building", "date", "status", "username");

-- AddForeignKey
ALTER TABLE "service_log_history" ADD CONSTRAINT "service_log_history_serviceLogId_fkey" FOREIGN KEY ("serviceLogId") REFERENCES "service_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "users_email_key" RENAME TO "users_username_key";
