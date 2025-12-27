import { PrismaClient } from "@prisma/client";
import { generateSingleBuildingPDF } from "../exportService.js";
import { sendEmailWithPDF, generateEmailTemplate } from "./emailService.js";
import { BUILDING_ADMIN_EMAILS } from "../config/buildingEmails.js";

const prisma = new PrismaClient();

let queueProcessor = null;
let isProcessing = false;

// Add email to queue (non-blocking)
export const queueEmailReport = async (building, date) => {
  try {
    const existingJob = await prisma.emailQueue.findFirst({
      where: {
        building,
        date,
        status: { in: ["pending", "processing"] },
      },
    });

    if (existingJob) {
      console.log(`⚠️ Email job already queued for ${building} on ${date}`);
      return existingJob;
    }

    const job = await prisma.emailQueue.create({
      data: {
        building,
        date,
        status: "pending",
        createdAt: new Date(),
      },
    });

    console.log(
      `✅ Email queued for ${building} on ${date} (Job ID: ${job.id})`
    );
    return job;
  } catch (error) {
    console.error("❌ Error queuing email:", error.message);
    throw error;
  }
};

// Process email queue (runs in background)
export const startEmailQueueProcessor = () => {
  console.log("🚀 Email Queue Processor starting...");

  // Process queue every 30 seconds
  queueProcessor = setInterval(async () => {
    if (isProcessing) return; // Prevent concurrent processing
    await processEmailQueue();
  }, 30 * 1000);

  console.log("✅ Email Queue Processor started");
};

// Process pending emails
const processEmailQueue = async () => {
  try {
    isProcessing = true;

    const pendingJobs = await prisma.emailQueue.findMany({
      where: { status: "pending" },
      take: 5, // Process max 5 at a time
      orderBy: { createdAt: "asc" },
    });

    if (pendingJobs.length === 0) return;

    console.log(`\n📧 Processing ${pendingJobs.length} queued emails...`);

    for (const job of pendingJobs) {
      try {
        // Update status to processing
        await prisma.emailQueue.update({
          where: { id: job.id },
          data: { status: "processing" },
        });

        // Fetch logs for this building and date
        const logs = await prisma.panelLog.findMany({
          where: {
            building: job.building,
            date: job.date,
          },
          orderBy: { time: "asc" },
        });

        if (logs.length === 0) {
          console.warn(
            `⚠️ No logs found for ${job.building} on ${job.date}. Marking as skipped.`
          );
          await prisma.emailQueue.update({
            where: { id: job.id },
            data: {
              status: "skipped",
              completedAt: new Date(),
              errorMessage: "No logs found for this date",
            },
          });
          continue;
        }

        // Generate PDF (with timeout)
        console.log(`📄 Generating PDF for ${job.building}...`);
        const pdfPromise = generateSingleBuildingPDF(job.building, logs);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("PDF generation timeout")),
            60 * 1000
          )
        );

        let pdfBuffer;
        try {
          pdfBuffer = await Promise.race([pdfPromise, timeoutPromise]);
        } catch (pdfError) {
          throw new Error(`PDF generation failed: ${pdfError.message}`);
        }

        // Get building admin email
        const buildingConfig = BUILDING_ADMIN_EMAILS[job.building];
        if (!buildingConfig) {
          throw new Error(`No email config found for ${job.building}`);
        }

        // Generate email content
        const subject = `Daily Panel Log Report - ${job.building} - ${new Date(
          job.date
        ).toLocaleDateString("en-IN")}`;
        const htmlContent = generateEmailTemplate(job.building, job.date);

        // Send email
        console.log(`📤 Sending email to ${buildingConfig.email}...`);
        const result = await sendEmailWithPDF(
          buildingConfig.email,
          job.building,
          subject,
          htmlContent,
          pdfBuffer,
          `${job.building}-PanelLog-${job.date}.pdf`
        );

        if (result.success) {
          await prisma.emailQueue.update({
            where: { id: job.id },
            data: {
              status: "sent",
              completedAt: new Date(),
              messageId: result.messageId,
            },
          });
          console.log(`✅ Email sent for ${job.building}`);
        } else {
          throw new Error(result.error || "Email send failed");
        }
      } catch (error) {
        console.error(
          `❌ Error processing email job ${job.id}:`,
          error.message
        );

        // Retry logic: increment attempt count
        const currentAttempts = (job.attempts || 0) + 1;
        const maxRetries = 3;

        if (currentAttempts < maxRetries) {
          await prisma.emailQueue.update({
            where: { id: job.id },
            data: {
              status: "pending", // Requeue
              attempts: currentAttempts,
              errorMessage: error.message,
            },
          });
          console.log(
            `🔄 Requeued job ${job.id} (Attempt ${currentAttempts}/${maxRetries})`
          );
        } else {
          await prisma.emailQueue.update({
            where: { id: job.id },
            data: {
              status: "failed",
              attempts: currentAttempts,
              errorMessage: error.message,
              completedAt: new Date(),
            },
          });
          console.error(`❌ Job ${job.id} failed after ${maxRetries} attempts`);
        }
      }
    }

    console.log("✅ Email queue processing complete\n");
  } catch (error) {
    console.error("❌ Error in email queue processor:", error.message);
  } finally {
    isProcessing = false;
  }
};

// Stop email queue processor
export const stopEmailQueueProcessor = () => {
  if (queueProcessor) {
    clearInterval(queueProcessor);
    queueProcessor = null;
    console.log("🛑 Email Queue Processor stopped");
  }
};

// Get queue status
export const getEmailQueueStatus = async () => {
  try {
    const pending = await prisma.emailQueue.count({
      where: { status: "pending" },
    });
    const processing = await prisma.emailQueue.count({
      where: { status: "processing" },
    });
    const sent = await prisma.emailQueue.count({
      where: { status: "sent" },
    });
    const failed = await prisma.emailQueue.count({
      where: { status: "failed" },
    });

    return { pending, processing, sent, failed };
  } catch (error) {
    console.error("Error getting queue status:", error);
    return null;
  }
};

// Get recent queue jobs
export const getRecentEmailJobs = async (limit = 20) => {
  try {
    const jobs = await prisma.emailQueue.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return jobs;
  } catch (error) {
    console.error("Error getting recent jobs:", error);
    return [];
  }
};
