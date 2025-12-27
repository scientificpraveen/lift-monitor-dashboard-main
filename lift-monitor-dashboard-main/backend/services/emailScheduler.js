import { queueEmailReport } from "./emailQueue.js";

let emailSchedulerInterval = null;

const BUILDINGS = [
  "PRESTIGE POLYGON",
  "PRESTIGE PALLADIUM",
  "PRESTIGE METROPOLITAN",
  "PRESTIGE COSMOPOLITAN",
  "PRESTIGE CYBER TOWERS",
];

// Calculate milliseconds until next 12:00 IST
const getTimeUntilNextNoon = () => {
  const now = new Date();

  // Create a date string for IST using proper timezone handling
  const istDateString = new Date(
    now.toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    })
  );

  // Extract IST hours and minutes
  const istHours = istDateString.getHours();
  const istMinutes = istDateString.getMinutes();
  const istSeconds = istDateString.getSeconds();

  // Calculate target time: 12:00 IST today
  const targetTimeIST = new Date(istDateString);
  targetTimeIST.setHours(12, 0, 0, 0);

  // Convert back to get UTC equivalent
  const targetUTC = new Date(
    targetTimeIST.toLocaleString("en-US", {
      timeZone: "UTC",
    })
  );

  let msUntilNoon = targetUTC.getTime() - now.getTime();

  // If time has passed today, schedule for tomorrow at 12:00 IST
  if (msUntilNoon <= 0) {
    targetTimeIST.setDate(targetTimeIST.getDate() + 1);
    const nextDayUTC = new Date(
      targetTimeIST.toLocaleString("en-US", {
        timeZone: "UTC",
      })
    );
    msUntilNoon = nextDayUTC.getTime() - now.getTime();
  }

  return msUntilNoon;
};

// Check if current time is around 12:00 IST (within 5 minute window)
const isNoonTimeWindow = () => {
  const now = new Date();

  // Get IST time properly
  const istDateString = new Date(
    now.toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    })
  );

  const hours = istDateString.getHours();
  const minutes = istDateString.getMinutes();

  // Check if time is between 11:55 and 12:05 IST
  return (hours === 11 && minutes >= 55) || (hours === 12 && minutes <= 5);
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

    // Queue emails for yesterday (non-blocking)
    const yesterday = new Date(istTime);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    let queuedCount = 0;
    for (const building of BUILDINGS) {
      try {
        await queueEmailReport(building, yesterdayStr);
        queuedCount++;
      } catch (error) {
        console.error(
          `❌ Failed to queue email for ${building}:`,
          error.message
        );
      }
    }

    console.log(
      `✅ Queued ${queuedCount} emails for processing (Date: ${yesterdayStr})`
    );
    return { queued: queuedCount };
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

// Manual trigger for testing (queues previous day's emails)
export const triggerDailyEmailReportManual = async () => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);

  const yesterday = new Date(istTime);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  console.log(`\n📧 Manual trigger: Queuing reports for ${yesterdayStr}...`);

  let queuedCount = 0;
  for (const building of BUILDINGS) {
    try {
      await queueEmailReport(building, yesterdayStr);
      queuedCount++;
    } catch (error) {
      console.error(`❌ Failed to queue email for ${building}:`, error.message);
    }
  }

  console.log(`✅ Queued ${queuedCount} emails for ${yesterdayStr}`);
  return { queued: queuedCount, date: yesterdayStr };
};

// Manual trigger with specific date
export const triggerEmailReportForDate = async (date) => {
  console.log(`\n📧 Manual trigger: Queuing reports for ${date}...`);

  let queuedCount = 0;
  for (const building of BUILDINGS) {
    try {
      await queueEmailReport(building, date);
      queuedCount++;
    } catch (error) {
      console.error(`❌ Failed to queue email for ${building}:`, error.message);
    }
  }

  console.log(`✅ Queued ${queuedCount} emails for ${date}`);
  return { queued: queuedCount, date };
};
