import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// List of buildings to create auto entries for
const BUILDINGS = [
  'PRESTIGE POLYGON',
  'PRESTIGE PALLADIUM',
  'PRESTIGE METROPOLITAN',
  'PRESTIGE COSMOPOLITAN',
  'PRESTIGE CYBER TOWERS'
];

// Helper to get current IST time slot (00:00, 02:00, 04:00, etc.)
const getCurrentTimeSlot = () => {
  const now = new Date();
  // Convert to IST (UTC+5:30)
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  
  const hours = istTime.getUTCHours();
  const timeSlotHour = Math.floor(hours / 2) * 2;
  
  return `${String(timeSlotHour).padStart(2, '0')}:00`;
};

// Helper to get previous time slot
const getPreviousTimeSlot = (currentSlot) => {
  const [hours] = currentSlot.split(':').map(Number);
  const previousHour = (hours - 2 + 24) % 24;
  return `${String(previousHour).padStart(2, '0')}:00`;
};

// Helper to get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  
  return istTime.toISOString().split('T')[0];
};

// Create empty panel log entry
const createEmptyEntry = async (building, date, timeSlot) => {
  try {
    // Double-check if entry exists (to prevent race conditions)
    const existing = await prisma.panelLog.findFirst({
      where: {
        building,
        date,
        time: timeSlot
      }
    });

    if (existing) {
      console.log(`ℹ Entry already exists for ${building} at ${date} ${timeSlot} (skipping)`);
      return existing;
    }

    const emptyEntry = {
      building,
      date,
      time: timeSlot,
      panelType: 'BOTH',
      htPanel: {
        icFromTneb: 'EB',
        voltageFromWreb: { volt: '' },
        currentAmp: { r: '', y: '', b: '', pf: '', hz: '' },
        outgoingTr1: {
          currentAmp: { r: '', y: '', b: '' },
          windingTemp: '',
          oilTemp: ''
        },
        outgoingTr2: {
          currentAmp: { r: '', y: '', b: '' },
          windingTemp: '',
          oilTemp: ''
        },
        outgoingTr3: {
          currentAmp: { r: '', y: '', b: '' },
          windingTemp: '',
          oilTemp: ''
        }
      },
      ltPanel: {
        incomer1: {
          voltage: { ry: '', yb: '', br: '' },
          currentAmp: { r: '', y: '', b: '' },
          tap: '',
          kwh: ''
        },
        incomer2: {
          voltage: { ry: '', yb: '', br: '' },
          currentAmp: { r: '', y: '', b: '' },
          tap: '',
          kwh: ''
        },
        incomer3: {
          voltage: { ry: '', yb: '', br: '' },
          currentAmp: { r: '', y: '', b: '' },
          tap: '',
          kwh: ''
        }
      },
      powerFailure: [],
      shiftIncharge: null,
      remarks: 'Auto-generated entry - Please update',
      lastUpdatedBy: 'System'
    };

    const created = await prisma.panelLog.create({
      data: emptyEntry
    });

    console.log(`✓ Auto-created entry for ${building} at ${date} ${timeSlot}`);
    return created;
  } catch (error) {
    // If it's a unique constraint error, the entry was created by another process
    if (error.code === 'P2002') {
      console.log(`ℹ Entry was created by another process for ${building} at ${date} ${timeSlot}`);
      return null;
    }
    console.error(`✗ Failed to create auto-entry for ${building} at ${date} ${timeSlot}:`, error.message);
    return null;
  }
};

// Check and create missing entries for previous time slot
export const checkAndCreateMissingEntries = async () => {
  try {
    const currentSlot = getCurrentTimeSlot();
    const previousSlot = getPreviousTimeSlot(currentSlot);
    const today = getTodayDate();

    console.log(`\n🔍 Checking for missing entries at ${new Date().toISOString()}`);
    console.log(`Current time slot: ${currentSlot}, Checking for previous slot: ${previousSlot}`);

    let createdCount = 0;

    for (const building of BUILDINGS) {
      try {
        // Check if entry exists for this building, date, and time slot
        const existingEntry = await prisma.panelLog.findFirst({
          where: {
            building,
            date: today,
            time: previousSlot
          }
        });

        if (!existingEntry) {
          console.log(`⚠ Missing entry detected: ${building} - ${today} ${previousSlot}`);
          const created = await createEmptyEntry(building, today, previousSlot);
          if (created) createdCount++;
        }
      } catch (buildingError) {
        console.error(`Error processing ${building}:`, buildingError.message);
        // Continue with other buildings even if one fails
        continue;
      }
    }

    if (createdCount > 0) {
      console.log(`✅ Created ${createdCount} auto-entries for ${previousSlot}`);
    } else {
      console.log(`✓ All entries present for ${previousSlot}`);
    }

    return createdCount;
  } catch (error) {
    console.error('Error in auto-entry service:', error);
    return 0;
  }
};

// Start the auto-entry scheduler (runs every 2 hours)
export const startAutoEntryScheduler = () => {
  console.log('🚀 Auto-entry scheduler started');
  console.log('📋 Buildings monitored:', BUILDINGS.join(', '));
  console.log('⏰ Checking every 2 hours for missing entries\n');

  // Run immediately on start
  checkAndCreateMissingEntries();

  // Schedule to run at the start of every 2-hour time slot
  // Run every 2 hours (2 * 60 * 60 * 1000 ms)
  setInterval(checkAndCreateMissingEntries, 2 * 60 * 60 * 1000);
};

// Stop the scheduler (for graceful shutdown)
export const stopAutoEntryScheduler = () => {
  console.log('🛑 Auto-entry scheduler stopped');
};
