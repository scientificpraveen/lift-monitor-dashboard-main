/*
  Warnings:

  - The `shiftIncharge` column on the `panel_logs` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "panel_logs" DROP COLUMN "shiftIncharge",
ADD COLUMN     "shiftIncharge" JSONB;
