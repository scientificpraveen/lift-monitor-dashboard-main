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

import { getISTDateString, getISTTimeString } from "../utils/timeUtils.js";

// Helper to get current IST time slot (00:00, 02:00, 04:00, etc.)
const getCurrentTimeSlot = () => {
  const timeStr = getISTTimeString(); // e.g. "14:27"
  const hours = parseInt(timeStr.split(':')[0], 10);
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
  const timeStr = getISTTimeString();
  const currentHour = parseInt(timeStr.split(':')[0], 10);
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

// Helper to get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  return getISTDateString();
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

let schedulerInterval;
let lastRunDate = null;

// Generate all 12 slots for a given date
export const generateDailySlots = async (dateStr) => {
  const allSlots = [
    "00:00", "02:00", "04:00", "06:00",
    "08:00", "10:00", "12:00", "14:00",
    "16:00", "18:00", "20:00", "22:00"
  ];

  let createdCount = 0;
  for (const building of BUILDINGS) {
    for (const timeSlot of allSlots) {
      try {
        const result = await createEmptyEntry(building, dateStr, timeSlot);
        if (result) createdCount++;
      } catch (e) {
        console.error(`Error creating slot ${timeSlot} for ${building}:`, e.message);
      }
    }
  }
  return createdCount;
};

// Start the strict IST 00:30 auto-entry scheduler
export const startAutoEntryScheduler = () => {
  console.log("⏰ Started strict IST 00:30 auto-entry scheduler (Checking every minute)");

  const checkTimeAndRun = async () => {
    const currentTime = getISTTimeString().slice(0, 5); // "HH:MM"
    const currentDate = getISTDateString();

    // Calculate minutes since midnight for strict boundary evaluation
    const currentMinutes = parseInt(currentTime.split(":")[0], 10) * 60 + parseInt(currentTime.split(":")[1], 10);
    const targetMinutes = 30; // 00:30 IST

    // Fire the creation script if clock is >= 00:30 and hasn't triggered today
    if (currentMinutes >= targetMinutes && lastRunDate !== currentDate) {
      console.log(`\n⏳ [${currentDate} ${currentTime} IST] Triggering daily 12 HT/LT blank slots generation...`);
      lastRunDate = currentDate; // Mark as run for today

      const createdCount = await generateDailySlots(currentDate);
      console.log(`✅ Daily HT/LT Generation Complete. Created ${createdCount} blank slots.`);
    }
  };

  // Fire execution on boot to catch missed generation windows over server restarts
  checkTimeAndRun();

  // Heartbeat loop every 60 seconds
  schedulerInterval = setInterval(checkTimeAndRun, 60000);
};

// Stop the scheduler (for graceful shutdown)
export const stopAutoEntryScheduler = () => {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    console.log("🛑 Auto-entry scheduler stopped.");
  }
};
