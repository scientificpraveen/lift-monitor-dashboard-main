-- AlterTable
ALTER TABLE "panel_logs" ADD COLUMN "panelType" TEXT;
UPDATE "panel_logs" SET "panelType" = 'BOTH' WHERE "panelType" IS NULL;
ALTER TABLE "panel_logs" ALTER COLUMN "panelType" SET NOT NULL;
ALTER TABLE "panel_logs" ALTER COLUMN "htPanel" DROP NOT NULL;
ALTER TABLE "panel_logs" ALTER COLUMN "ltPanel" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "panel_logs_building_date_panelType_idx" ON "panel_logs"("building", "date", "panelType");
