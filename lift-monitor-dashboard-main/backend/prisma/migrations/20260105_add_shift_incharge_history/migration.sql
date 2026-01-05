-- CreateTable
CREATE TABLE "shift_incharge_history" (
    "id" SERIAL NOT NULL,
    "panelLogId" INTEGER NOT NULL,
    "verifiedBy" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shiftData" JSONB NOT NULL,

    CONSTRAINT "shift_incharge_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shift_incharge_history_panelLogId_verifiedAt_idx" ON "shift_incharge_history"("panelLogId", "verifiedAt");

-- AddForeignKey
ALTER TABLE "shift_incharge_history" ADD CONSTRAINT "shift_incharge_history_panelLogId_fkey" FOREIGN KEY ("panelLogId") REFERENCES "panel_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
