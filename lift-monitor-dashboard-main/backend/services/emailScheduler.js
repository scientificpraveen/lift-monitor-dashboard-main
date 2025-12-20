import { sendDailyReports } from "./emailService.js";

let emailSchedulerInterval = null;

// Calculate milliseconds until next 12:00 IST
const getTimeUntilNextNoon = () => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);

  // Set target time to 12:00 IST
  const targetTime = new Date(istTime);
  targetTime.setUTCHours(6, 30, 0, 0); // 12:00 IST = 06:30 UTC

  let msUntilNoon = targetTime.getTime() - istTime.getTime();

  // If time has passed today, schedule for tomorrow
  if (msUntilNoon <= 0) {
    targetTime.setUTCDate(targetTime.getUTCDate() + 1);
    msUntilNoon = targetTime.getTime() - istTime.getTime();
  }

  return msUntilNoon;
};

// Check if current time is around 12:00 IST (within 5 minute window)
const isNoonTimeWindow = () => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);

  const hours = istTime.getUTCHours();
  const minutes = istTime.getUTCMinutes();

  // Check if time is between 06:25 and 06:35 UTC (12:00 IST ± 5 min)
  return hours === 6 && minutes >= 25 && minutes <= 35;
};

// Send reports and handle scheduling
const handleDailyEmailReport = async () => {
  try {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset);
    const istDateStr = istTime.toISOString().split("T")[0];

    console.log(
      `\n📧 [${istTime.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      })}] Running daily email report scheduler...`
    );

    // Send reports for yesterday (so admins get the previous day's data at noon)
    const yesterday = new Date(istTime);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const result = await sendDailyReports(yesterdayStr);

    console.log(
      `✅ Daily email report scheduled for ${yesterdayStr} completed`
    );
    return result;
  } catch (error) {
    console.error("❌ Error in email scheduler:", error.message);
  }
};

// Start the email scheduler (runs at 12:00 IST daily)
export const startEmailScheduler = () => {
  console.log("🚀 Email Scheduler initializing...");
  console.log("📅 Scheduled to send daily reports at 12:00 IST");
  console.log("📧 Reports will include data from the previous day\n");

  // Calculate initial delay to 12:00 IST
  const msUntilNoon = getTimeUntilNextNoon();
  const nextNoonDate = new Date(Date.now() + msUntilNoon);

  console.log(
    `⏰ Next report will be sent at: ${nextNoonDate.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    })}`
  );

  // Set initial timeout for first run
  setTimeout(() => {
    console.log("\n⏱️ 12:00 IST reached! Processing daily reports...");
    handleDailyEmailReport();

    // After first run, set interval to run daily
    emailSchedulerInterval = setInterval(() => {
      if (isNoonTimeWindow()) {
        console.log("\n⏱️ 12:00 IST reached! Processing daily reports...");
        handleDailyEmailReport();
      }
    }, 60 * 1000); // Check every minute
  }, msUntilNoon);

  console.log("✅ Email scheduler started\n");
};

// Stop the email scheduler
export const stopEmailScheduler = () => {
  if (emailSchedulerInterval) {
    clearInterval(emailSchedulerInterval);
    emailSchedulerInterval = null;
    console.log("🛑 Email scheduler stopped");
  }
};

// Manual trigger for testing (sends previous day's data)
export const triggerDailyEmailReportManual = async () => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);

  const yesterday = new Date(istTime);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  console.log(`\n📧 Manual trigger: Sending reports for ${yesterdayStr}...`);
  return await sendDailyReports(yesterdayStr);
};

// Manual trigger with specific date
export const triggerEmailReportForDate = async (date) => {
  console.log(`\n📧 Manual trigger: Sending reports for ${date}...`);
  return await sendDailyReports(date);
};
