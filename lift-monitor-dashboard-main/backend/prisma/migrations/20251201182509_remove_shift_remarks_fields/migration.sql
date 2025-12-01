/*
  Warnings:

  - You are about to drop the column `engineerSignature` on the `panel_logs` table. All the data in the column will be lost.
  - You are about to drop the column `remarks` on the `panel_logs` table. All the data in the column will be lost.
  - You are about to drop the column `shiftIncharge` on the `panel_logs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "panel_logs" DROP COLUMN "engineerSignature",
DROP COLUMN "remarks",
DROP COLUMN "shiftIncharge";
