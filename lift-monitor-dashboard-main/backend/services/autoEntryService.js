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

// Helper to get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);

  return istTime.toISOString().split("T")[0];
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
        `✓ Auto-created entry for ${building} at ${date} ${timeSlot}`
      );
    } else {
      console.log(
        `ℹ Entry already exists for ${building} at ${date} ${timeSlot} (skipped)`
      );
    }

    return isNew ? result : null;
  } catch (error) {
    console.error(
      `✗ Failed to create auto-entry for ${building} at ${date} ${timeSlot}:`,
      error.message
    );
    return null;
  }
};

// Check and create missing entries for previous time slot
export const checkAndCreateMissingEntries = async () => {
  try {
    const currentSlot = getCurrentTimeSlot();
    const previousSlot = getPreviousTimeSlot(currentSlot);
    const today = getTodayDate();

    console.log(
      `\n🔍 Checking for missing entries at ${new Date().toISOString()}`
    );
    console.log(
      `Current time slot: ${currentSlot}, Checking for previous slot: ${previousSlot}`
    );

    let createdCount = 0;

    for (const building of BUILDINGS) {
      try {
        const created = await createEmptyEntry(building, today, previousSlot);
        if (created) createdCount++;
      } catch (buildingError) {
        console.error(`Error processing ${building}:`, buildingError.message);
        continue;
      }
    }

    if (createdCount > 0) {
      console.log(
        `✅ Created ${createdCount} auto-entries for ${previousSlot}`
      );
    } else {
      console.log(`✓ All entries already present for ${previousSlot}`);
    }

    return createdCount;
  } catch (error) {
    console.error("Error in auto-entry service:", error);
    return 0;
  }
};

// Start the auto-entry scheduler (runs every 2 hours)
export const startAutoEntryScheduler = () => {
  console.log("🚀 Auto-entry scheduler started");
  console.log("📋 Buildings monitored:", BUILDINGS.join(", "));
  console.log("⏰ Checking every 2 hours for missing entries\n");

  // Run immediately on start
  checkAndCreateMissingEntries();

  // Schedule to run at the start of every 2-hour time slot
  // Run every 2 hours (2 * 60 * 60 * 1000 ms)
  setInterval(checkAndCreateMissingEntries, 2 * 60 * 60 * 1000);
};

// Stop the scheduler (for graceful shutdown)
export const stopAutoEntryScheduler = () => {
  console.log("🛑 Auto-entry scheduler stopped");
};
