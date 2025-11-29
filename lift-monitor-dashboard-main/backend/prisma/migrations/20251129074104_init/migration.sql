-- CreateTable
CREATE TABLE "panel_logs" (
    "id" SERIAL NOT NULL,
    "building" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "htPanel" JSONB NOT NULL,
    "ltPanel" JSONB NOT NULL,
    "shiftIncharge" JSONB,
    "powerFailure" JSONB,
    "remarks" TEXT,
    "engineerSignature" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "panel_logs_pkey" PRIMARY KEY ("id")
);
