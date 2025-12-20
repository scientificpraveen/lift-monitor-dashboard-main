-- CreateTable
CREATE TABLE "email_logs" (
    "id" SERIAL NOT NULL,
    "building" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "messageId" TEXT,
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_logs_building_sentAt_idx" ON "email_logs"("building", "sentAt");

-- CreateIndex
CREATE INDEX "email_logs_status_sentAt_idx" ON "email_logs"("status", "sentAt");
