import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// List of buildings to create auto entries for
const BUILDINGS = [
  "PRESTIGE POLYGON",
  "PRESTIGE PALLADIUM",
  "PRESTIGE METROPOLITAN",
  "PRESTIGE COSMOPOLITAN",
  "PRESTIGE CYBER TOWERS",
];

// Helper to get current IST time slot (00:00, 02:00, 04:00, etc.)
const getCurrentTimeSlot = () => {
  const now = new Date();
  // Convert to IST (UTC+5:30)
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);

  const hours = istTime.getUTCHours();
  const timeSlotHour = Math.floor(hours / 2) * 2;

  return `${String(timeSlotHour).padStart(2, "0")}:00`;
};

// Helper to get previous time slot
const getPreviousTimeSlot = (currentSlot) => {
  const [hours] = currentSlot.split(":").map(Number);
  const previousHour = (hours - 2 + 24) % 24;
  return `${String(previousHour).padStart(2, "0")}:00`;
};

// Helper to get all time slots up to and including current slot
const getSlotsTillNow = () => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);

  const currentHour = istTime.getUTCHours();
  const currentSlotHour = Math.floor(currentHour / 2) * 2;

  const allSlots = [
    "00:00",
    "02:00",
    "04:00",
    "06:00",
    "08:00",
    "10:00",
    "12:00",
    "14:00",
    "16:00",
    "18:00",
    "20:00",
    "22:00",
  ];

  // Return only slots that have occurred up to current time
  return allSlots.filter((slot) => {
    const [slotHour] = slot.split(":").map(Number);
    return slotHour <= currentSlotHour;
  });
};

// Helper to get today's date in YYYY-MM-DD format (IST)
const getTodayDate = () => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);

  // Use getUTC* methods directly since we've already added IST offset
  const year = istTime.getUTCFullYear();
  const month = String(istTime.getUTCMonth() + 1).padStart(2, "0");
  const day = String(istTime.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// Create empty panel log entry using upsert to prevent duplicates
const createEmptyEntry = async (building, date, timeSlot) => {
  try {
    const emptyEntry = {
      building,
      date,
      time: timeSlot,
      panelType: "BOTH",
      htPanel: {
        icFromTneb: "EB",
        voltageFromWreb: { volt: "" },
        currentAmp: { r: "", y: "", b: "", pf: "", hz: "" },
        outgoingTr1: {
          currentAmp: { r: "", y: "", b: "" },
          windingTemp: "",
          oilTemp: "",
        },
        outgoingTr2: {
          currentAmp: { r: "", y: "", b: "" },
          windingTemp: "",
          oilTemp: "",
        },
        outgoingTr3: {
          currentAmp: { r: "", y: "", b: "" },
          windingTemp: "",
          oilTemp: "",
        },
      },
      ltPanel: {
        incomer1: {
          voltage: { ry: "", yb: "", br: "" },
          currentAmp: { r: "", y: "", b: "" },
          tap: "",
          kwh: "",
        },
        incomer2: {
          voltage: { ry: "", yb: "", br: "" },
          currentAmp: { r: "", y: "", b: "" },
          tap: "",
          kwh: "",
        },
        incomer3: {
          voltage: { ry: "", yb: "", br: "" },
          currentAmp: { r: "", y: "", b: "" },
          tap: "",
          kwh: "",
        },
      },
      powerFailure: [],
      shiftIncharge: null,
      remarks: "Auto-generated entry - Please update",
      lastUpdatedBy: "System",
    };

    // Use upsert to prevent duplicates - only create if doesn't exist
    const result = await prisma.panelLog.upsert({
      where: {
        building_date_time: {
          building,
          date,
          time: timeSlot,
        },
      },
      update: {}, // Don't update if exists
      create: emptyEntry,
    });

    // Check if it was a new creation by comparing timestamps
    const isNew = new Date() - new Date(result.createdAt) < 5000; // Created within last 5 seconds

    if (isNew) {
      console.log(
        `✓ Auto-created entry for ${building} at ${date} ${timeSlot}`,
      );
    } else {
      console.log(
        `ℹ Entry already exists for ${building} at ${date} ${timeSlot} (skipped)`,
      );
    }

    return isNew ? result : null;
  } catch (error) {
    console.error(
      `✗ Failed to create auto-entry for ${building} at ${date} ${timeSlot}:`,
      error.message,
    );
    return null;
  }
};

// Check and create missing entries for all past time slots today
export const checkAndCreateMissingEntries = async () => {
  try {
    const slotsTillNow = getSlotsTillNow();
    const today = getTodayDate();

    console.log(
      `\n🔍 Checking for missing entries at ${new Date().toISOString()}`,
    );
    console.log(`Today's date: ${today}`);
    console.log(`Slots to check: ${slotsTillNow.join(", ")}`);

    let createdCount = 0;
    let skippedCount = 0;

    for (const building of BUILDINGS) {
      for (const timeSlot of slotsTillNow) {
        try {
          const result = await createEmptyEntry(building, today, timeSlot);
          if (result) {
            createdCount++;
          } else {
            skippedCount++;
          }
        } catch (slotError) {
          console.error(
            `Error for ${building} at ${timeSlot}:`,
            slotError.message,
          );
        }
      }
    }

    console.log(
      `✅ Created: ${createdCount} entries | Skipped (existing): ${skippedCount} entries`,
    );

    return createdCount;
  } catch (error) {
    console.error("Error in auto-entry service:", error);
    return 0;
  }
};

// Start the auto-entry scheduler (runs at exact 2-hour boundaries)
export const startAutoEntryScheduler = () => {
  console.log("🚀 Auto-entry scheduler started");
  console.log("📋 Buildings monitored:", BUILDINGS.join(", "));
  console.log(
    "⏰ Checking at start of every 2-hour slot (00:00, 02:00, 04:00, etc.)\n",
  );

  // Run immediately on start
  checkAndCreateMissingEntries();

  // Calculate time until next 2-hour boundary
  const getTimeUntilNextSlot = () => {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset);

    const currentHours = istTime.getUTCHours();
    const currentMinutes = istTime.getUTCMinutes();
    const currentSeconds = istTime.getUTCSeconds();

    const nextSlotHour = Math.ceil(currentHours / 2) * 2;
    const nextSlotTime = new Date(istTime);
    nextSlotTime.setUTCHours(nextSlotHour % 24, 0, 0, 0);

    if (nextSlotHour === 24) {
      nextSlotTime.setUTCDate(nextSlotTime.getUTCDate() + 1);
    }

    return nextSlotTime.getTime() - istTime.getTime();
  };

  // Schedule first run at next 2-hour boundary
  const timeUntilNextSlot = getTimeUntilNextSlot();
  const nextRunTime = new Date(Date.now() + timeUntilNextSlot);

  console.log(
    `⏰ Next scheduled run: ${nextRunTime.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    })}\n`,
  );

  setTimeout(() => {
    checkAndCreateMissingEntries();
    // Then run every 2 hours at exact boundaries
    setInterval(checkAndCreateMissingEntries, 2 * 60 * 60 * 1000);
  }, timeUntilNextSlot);
};

// Stop the scheduler (for graceful shutdown)
export const stopAutoEntryScheduler = () => {
  console.log("🛑 Auto-entry scheduler stopped");
};
