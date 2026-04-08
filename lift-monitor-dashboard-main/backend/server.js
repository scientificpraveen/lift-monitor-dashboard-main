import express from "express";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import { WebSocketServer } from "ws";
import { createServer } from "http";
import * as panelLogService from "./panelLogContext.js";
import { generateExcelReport, generatePDFReport } from "./exportService.js";
import authRoutes from "./routes/auth.js";
import serviceLogRoutes from "./routes/serviceLogs.js";
import userRoutes from "./routes/users.js";
import shiftRoutes from "./routes/shiftRoutes.js";
import guardRoutes from "./routes/guardRoutes.js";
import fireRoutes from "./routes/fireRoutes.js";
import { authMiddleware } from "./middleware/auth.js";
import {
  startAutoEntryScheduler,
  stopAutoEntryScheduler,
} from "./services/autoEntryService.js";
import {
  startEmailScheduler,
  stopEmailScheduler,
  triggerDailyEmailReportManual,
  triggerEmailReportForDate,
} from "./services/emailScheduler.js";
import {
  initializeBrevoTransporter,
  testEmailConnection,
} from "./services/brevoEmailService.js";
import {
  startEmailQueueProcessor,
  stopEmailQueueProcessor,
  getEmailQueueStatus,
  getRecentEmailJobs,
} from "./services/emailQueue.js";
import { PrismaClient } from "@prisma/client";
import { getISTDateString, getISTTimeString } from "./utils/timeUtils.js";

const app = express();
const PORT = process.env.PORT || 3001;
const prisma = new PrismaClient();

const defaultOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",")
  : ["http://localhost:5000", "http://localhost:5001", "http://localhost:3001"];

const corsOptions = {
  origin: defaultOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(compression());
app.use(cookieParser());
app.use("/api/auth", authRoutes);
app.use("/api/service-logs", serviceLogRoutes);
app.use("/api/shifts", shiftRoutes);
app.use("/api/users", userRoutes);
app.use("/api/guard", guardRoutes);
app.use("/api/fire", fireRoutes);

// Initialize STP - No external fetch needed, defaults are set.
console.log("STP System Initialized with Defaults.");

const server = createServer(app);

const wss = new WebSocketServer({ server, path: "/ws" });

const buildings = [
  "PRESTIGE POLYGON",
  "PRESTIGE PALLADIUM",
  "PRESTIGE METROPOLITAN",
  "PRESTIGE COSMOPOLITAN",
  "PRESTIGE CYBER TOWERS",
];

let liftData = {};

async function initializeLiftData() {
  try {
    const configs = await prisma.buildingLiftConfig.findMany();
    const configMap = new Map();
    configs.forEach(c => configMap.set(c.building, c.panels));

    buildings.forEach(b => {
      const panels = configMap.get(b) || [];
      liftData[b] = panels.map(id => ({ ID: id, Fl: "G", Alarm: "0", Door: "0", lastUpdated: Date.now() }));
    });
    console.log("Lift Data Synchronized with Postgres PostgreSQL Configs");
  } catch (e) { console.error("Error loading Lift configs", e); }
}
initializeLiftData();

// -- STP AUTOMATION STATE --
const generateStpState = () => ({
  M1: 2, M2: 2, M3: 2, M4: 2, M5: 2, M6: 2, M7: 2, M8: 2, M9: 2, M10: 2, M11: 2, M12: 2, M13: 2,
  B1: 2, B2: 2, FAF1: 2, FAF2: 2, EF1: 2, EF2: 2,
  AirSolenoid: 2, WaterSolenoid: 2, ClarifierValve: 1, UV: 2, DosingPump: 2, ARM: 2,
  PSFValve: 6, ACFValve: 6,
  CollectionTankLevel: "0n", SBRTankLevel: "0n", SludgeTankLevel: "0n", FilterTankLevel: "0n", TreatedWaterTankLevel: "0n", SoftwaterTankLevel: "0n",
  InletPressure: "0.0n", OutletPressure: "0.0n",
  DO1: "0.0n", DO2: "0.0n", SoftnerTH: "0.0n", SBRTSS: "0.0n", ClarifierTSS: "0.0n",
  ACFTime: "00:00:00n", PSFTime: "00:00:00n",
  deviceOnline: false
});

let stpStates = {};

const VALIDATION_RULES = {
  MOTORS: ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12', 'M13'],
  BLOWERS_FANS: ['B1', 'B2', 'FAF1', 'FAF2', 'EF1', 'EF2'],
  VALVES_SOLENOID: ['AirSolenoid', 'WaterSolenoid', 'ClarifierValve', 'UV', 'DosingPump', 'ARM'],
  VALVES_5WAY: ['PSFValve', 'ACFValve'],
  SENSORS: ['InletPressure', 'OutletPressure', 'DO1', 'DO2', 'SoftnerTH', 'SBRTSS', 'ClarifierTSS'],
  TANKS: ['CollectionTankLevel', 'SBRTankLevel', 'SludgeTankLevel', 'FilterTankLevel', 'TreatedWaterTankLevel', 'SoftwaterTankLevel'],
  VESSEL_TIMES: ['ACFTime', 'PSFTime']
};

const processStpData = (incomingData, building) => {
  if (!incomingData || typeof incomingData !== 'object') return {};
  if (!stpStates[building]) stpStates[building] = generateStpState();

  const processed = {};
  const currentState = stpStates[building];

  Object.keys(incomingData).forEach(key => {
    if (!currentState.hasOwnProperty(key)) return;

    const val = incomingData[key];

    if (VALIDATION_RULES.SENSORS.includes(key) || VALIDATION_RULES.TANKS.includes(key)) {
      if (typeof val === 'string' && (val.endsWith('n') || val.endsWith('e'))) {
        const typeStr = val.substring(0, val.length - 1);
        const typeNum = parseFloat(typeStr);
        if (!isNaN(typeNum)) {
          if (VALIDATION_RULES.TANKS.includes(key)) {
            if (typeNum >= 0 && typeNum <= 100) {
              const roundedStr = `${Math.round(typeNum)}${val.slice(-1)}`;
              currentState[key] = roundedStr;
              processed[key] = roundedStr;
            }
          } else {
            currentState[key] = val;
            processed[key] = val;
          }
        }
      } else if (typeof val === 'number') {
        if (VALIDATION_RULES.TANKS.includes(key)) {
          if (val >= 0 && val <= 100) {
            const roundedVal = Math.round(val);
            currentState[key] = `${roundedVal}n`;
            processed[key] = `${roundedVal}n`;
          }
        } else {
          currentState[key] = `${val}n`;
          processed[key] = `${val}n`;
        }
      }
    }
    else if (VALIDATION_RULES.VALVES_5WAY.includes(key)) {
      const intVal = parseInt(val);
      if ([0, 1, 2, 3, 4, 5, 6].includes(intVal)) {
        currentState[key] = intVal;
        processed[key] = intVal;
      }
    }
    else if (VALIDATION_RULES.MOTORS.includes(key) || VALIDATION_RULES.BLOWERS_FANS.includes(key) || VALIDATION_RULES.VALVES_SOLENOID.includes(key)) {
      const intVal = parseInt(val);
      if ([0, 1, 2].includes(intVal)) {
        currentState[key] = intVal;
        processed[key] = intVal;
      }
    }
    else if (VALIDATION_RULES.VESSEL_TIMES.includes(key)) {
      if (typeof val === 'string' && /^\d{2}:[0-5]\d:[0-5]\d[ne]$/.test(val)) {
        currentState[key] = val;
        processed[key] = val;
      }
    }
  });

  return processed;
};

const broadcastWS = (update) => {
  const message = JSON.stringify({
    type: "liftUpdate",
    data: update,
  });

  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(message);
    }
  });
};

app.get("/api/lifts", (req, res) => {
  try {
    const now = Date.now();
    const payload = {};
    for (const b in liftData) {
      payload[b] = liftData[b].map(l => ({ ...l, isOffline: now - (l.lastUpdated || now) > 60000 }));
    }
    res.json(payload);
  } catch (error) {
    console.error("Error fetching lift data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/buildings", (req, res) => {
  res.json(buildings);
});

app.get("/api/lifts/:building", (req, res) => {
  try {
    const building = req.params.building.toUpperCase();
    if (liftData[building]) {
      const now = Date.now();
      const payload = liftData[building].map(l => ({ ...l, isOffline: now - (l.lastUpdated || now) > 60000 }));
      res.json({ [building]: payload });
    } else {
      res.status(404).json({ error: "Building not found" });
    }
  } catch (error) {
    console.error("Error fetching building data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/lifts", (req, res) => {
  try {
    let buildingName = null;
    let lifts = [];

    if (req.body.building && Array.isArray(req.body.lifts)) {
      buildingName = req.body.building.toUpperCase();
      lifts = req.body.lifts;
    } else {
      const keys = Object.keys(req.body);
      if (keys.length > 0) {
        buildingName = keys[0].toUpperCase();
        lifts = Array.isArray(req.body[keys[0]])
          ? req.body[keys[0]]
          : [req.body[keys[0]]];
      }
    }

    if (!buildingName || !liftData[buildingName]) {
      return res.status(400).json({ error: "Invalid building name or format" });
    }

    // Strict IoT Array Overwrite Parsing
    lifts.forEach(incomingLift => {
      const existingLift = liftData[buildingName].find(l => l.ID === incomingLift.ID);
      if (existingLift) {
        existingLift.Fl = incomingLift.Fl ?? existingLift.Fl;
        existingLift.Alarm = incomingLift.Alarm ?? existingLift.Alarm;
        existingLift.Door = incomingLift.Door ?? existingLift.Door;
        existingLift.lastUpdated = Date.now();
      }
    });

    broadcastWS({ [buildingName]: liftData[buildingName] });

    res.json({ message: "Lift data successfully mapped", updated: buildingName });
  } catch (error) {
    console.error("Error saving lift config:", error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// -- STP API ENDPOINTS --
app.get('/api/stp', (req, res) => {
  const building = req.query.building;
  if (!building) return res.status(400).json({ error: "Building parameter required" });
  if (!stpStates[building]) stpStates[building] = generateStpState();
  res.json(stpStates[building]);
});

app.post('/api/update-stp', (req, res) => {
  const incomingData = req.body;
  const building = incomingData.building;
  if (!building) return res.status(400).json({ error: "Building parameter required" });

  if (!stpStates[building]) stpStates[building] = generateStpState();
  stpStates[building].deviceOnline = true;
  stpStates[building].lastUpdated = Date.now();

  const processed = processStpData(incomingData, building);

  const message = JSON.stringify({ type: 'stpUpdate', building, data: stpStates[building] });
  wss.clients.forEach(client => {
    if (client.readyState === 1) client.send(message);
  });

  res.json({ success: true, currentState: stpStates[building], updated: processed });
});

// -- PARKING SLOT VACANCY API --
const generateParkingState = () => ({
  P1: { value: 0, lastUpdated: Date.now() },
  P2: { value: 0, lastUpdated: Date.now() },
  P3: { value: 0, lastUpdated: Date.now() },
  P4: { value: 0, lastUpdated: Date.now() }
});

let parkingStates = {};

app.get('/api/parking-slots', (req, res) => {
  const building = req.query.building;
  if (!building) return res.status(400).json({ error: "Building parameter required" });
  if (!parkingStates[building]) parkingStates[building] = generateParkingState();
  res.json(parkingStates[building]);
});

app.post('/api/update-parking-slots', (req, res) => {
  const incomingData = req.body;
  const building = incomingData.building;
  if (!building) return res.status(400).json({ error: "Building parameter required" });

  if (!incomingData || typeof incomingData !== 'object') {
    return res.status(400).json({ error: "Invalid data format" });
  }

  if (!parkingStates[building]) parkingStates[building] = generateParkingState();
  const currentSlots = parkingStates[building];

  let updated = false;
  Object.keys(incomingData).forEach(key => {
    if (currentSlots.hasOwnProperty(key)) {
      const val = parseInt(incomingData[key]);
      if (val === 0 || val === 1) {
        currentSlots[key] = { value: val, lastUpdated: Date.now() };
        updated = true;
      }
    }
  });

  res.json({ success: true, currentSlots: parkingStates[building] });
});

app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Test email endpoints
app.get("/api/test-email/trigger-manual", async (req, res) => {
  try {
    const result = await triggerDailyEmailReportManual();
    res.json({
      success: true,
      message: "Manual email trigger executed",
      result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.post("/api/test-email/trigger-date", async (req, res) => {
  try {
    const { date } = req.body;
    if (!date) {
      return res.status(400).json({
        success: false,
        error: "Date parameter required (format: YYYY-MM-DD)",
      });
    }
    const result = await triggerEmailReportForDate(date);
    res.json({
      success: true,
      message: `Email trigger executed for date: ${date}`,
      result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Email queue endpoints
app.get("/api/email/queue/status", async (req, res) => {
  try {
    const status = await getEmailQueueStatus();
    res.json({ success: true, status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/email/queue/jobs", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const jobs = await getRecentEmailJobs(limit);
    res.json({ success: true, jobs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Email logs endpoint
app.get("/api/email/logs", async (req, res) => {
  try {
    const { building, status, days = 7 } = req.query;

    const where = {};
    if (building) where.building = building;
    if (status) where.status = status;

    // Get logs from last N days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    where.createdAt = { gte: startDate };

    const logs = await prisma.emailLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    res.json({ success: true, logs, count: logs.length });
  } catch (error) {
    console.error("Error fetching email logs:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/test-email/connection", async (req, res) => {
  try {
    const result = await testEmailConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// NEW ENDPOINT: Send test email to a building admin
app.post("/api/test-email/send-test", async (req, res) => {
  try {
    const { recipientEmail, buildingName } = req.body;

    if (!recipientEmail || !buildingName) {
      return res.status(400).json({
        success: false,
        error: "recipientEmail and buildingName required",
      });
    }

    const { sendEmailWithPDF, generateEmailTemplate } = await import(
      "./services/emailService.js"
    );
    const { generateSingleBuildingPDF } = await import("./exportService.js");

    // Get today's date
    const today = getISTDateString();

    // Fetch actual logs for this building from database
    const logs = await panelLogService.getPanelLogs({
      building: buildingName,
      date: today,
    });

    if (logs.length === 0) {
      return res.status(400).json({
        success: false,
        error: `No logs found for ${buildingName} on ${today}. Cannot generate empty report.`,
      });
    }

    // Generate test PDF with actual log data
    const pdfBuffer = await generateSingleBuildingPDF(buildingName, logs);

    // Generate email template
    const htmlContent = generateEmailTemplate(buildingName, today);

    // Send the email
    const result = await sendEmailWithPDF(
      recipientEmail,
      buildingName,
      `[TEST] Daily Panel Log Report - ${buildingName}`,
      htmlContent,
      pdfBuffer,
      `test-report-${buildingName}-${today}.pdf`
    );

    res.json(result);
  } catch (error) {
    console.error("Test email error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get("/api/panel-logs", authMiddleware, async (req, res) => {
  try {
    const { building, date, dateFrom, dateTo, panelType, time } = req.query;
    const userAssignedBuildings = req.user?.assignedBuildings || [];

    const filters = {};

    // If user has assigned buildings (restricted user), filter to those
    if (userAssignedBuildings.length > 0) {
      // If building is specified in query, check if user has access to it
      if (building) {
        if (!userAssignedBuildings.includes(building)) {
          return res.status(403).json({
            success: false,
            error: "Access denied to this building",
          });
        }
        filters.building = building;
      } else {
        // If no building specified, return logs only from assigned buildings
        filters.buildings = userAssignedBuildings;
      }
    } else {
      // Admin user can see all buildings
      if (building) filters.building = building;
    }

    if (date) filters.date = date;
    if (dateFrom || dateTo) {
      filters.dateRange = { from: dateFrom, to: dateTo };
    }
    if (panelType) filters.panelType = panelType;
    if (time) filters.time = time;

    const logs = await panelLogService.getPanelLogs(filters);

    res.json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    console.error("Error fetching panel logs:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
});

app.get("/api/panel-logs/:id", authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userAssignedBuildings = req.user?.assignedBuildings || [];

    const log = await panelLogService.getPanelLogById(id);

    if (!log) {
      return res.status(404).json({
        success: false,
        error: "Panel log not found",
      });
    }

    // Check if user has access to view this log's building
    if (
      userAssignedBuildings.length > 0 &&
      !userAssignedBuildings.includes(log.building)
    ) {
      return res.status(403).json({
        success: false,
        error: "Access denied to view this building's logs",
      });
    }

    res.json({
      success: true,
      data: log,
    });
  } catch (error) {
    console.error("Error fetching panel log:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
});

// CORE API HANDLER FOR ISOLATED PANEL LOG POSTS
const handlePanelLogCreate = (scope) => async (req, res) => {
  try {
    const logData = req.body;
    const userAssignedBuildings = req.user?.assignedBuildings || [];

    if (!logData.building) {
      return res.status(400).json({ success: false, error: "Missing required fields: building is required" });
    }

    if (!logData.date || !logData.time) {
      if (!logData.date) logData.date = getISTDateString();
      if (!logData.time) logData.time = getISTTimeString();
    }

    if (userAssignedBuildings.length > 0 && !userAssignedBuildings.includes(logData.building)) {
      return res.status(403).json({ success: false, error: "Access denied." });
    }

    const newLog = await panelLogService.createPanelLog(logData, scope);

    res.status(201).json({
      success: true,
      message: `${scope} Panel log created securely`,
      data: newLog,
    });
  } catch (error) {
    console.error(`Error creating ${scope} panel log:`, error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
};

app.post("/api/panel-logs", authMiddleware, handlePanelLogCreate('BOTH'));
app.post("/api/panel-logs/ht", authMiddleware, handlePanelLogCreate('HT'));
app.post("/api/panel-logs/lt", authMiddleware, handlePanelLogCreate('LT'));

app.put("/api/panel-logs/:id", authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const logData = req.body;
    const userAssignedBuildings = req.user?.assignedBuildings || [];

    // Check if user has access to the building they're trying to update
    if (
      userAssignedBuildings.length > 0 &&
      logData.building &&
      !userAssignedBuildings.includes(logData.building)
    ) {
      return res.status(403).json({
        success: false,
        error:
          "Access denied. You can only update logs for your assigned buildings",
      });
    }

    const updatedLog = await panelLogService.updatePanelLog(id, logData);

    if (!updatedLog) {
      console.error("DEBUG PUT UPDATE FAILED:", { id, logData });
      return res.status(404).json({
        success: false,
        error: "Panel log not found",
      });
    }

    res.json({
      success: true,
      message: "Panel log updated successfully",
      data: updatedLog,
    });
  } catch (error) {
    console.error("Error updating panel log:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
});

app.get("/api/panel-logs/export/excel", authMiddleware, async (req, res) => {
  try {
    const { generateExcel } = await import("./services/panelExport.js");
    const userAssignedBuildings = req.user?.assignedBuildings || [];
    let { building, date, dateFrom, dateTo, panelType, time } = req.query;

    // If user is restricted and building is specified, check access
    if (
      userAssignedBuildings.length > 0 &&
      building &&
      !userAssignedBuildings.includes(building)
    ) {
      return res.status(403).json({
        success: false,
        error: "Access denied to export logs for this building",
      });
    }

    // If user is restricted and no building specified, restrict to assigned buildings only
    if (userAssignedBuildings.length > 0 && !building) {
      // Pass the assigned buildings list to the export service
      const filters = {
        buildings: userAssignedBuildings,
        date,
        dateFrom,
        dateTo,
        panelType,
        time,
      };
      const buffer = await generateExcel(filters);
      const buildingTag = userAssignedBuildings.length === 1
        ? userAssignedBuildings[0].replace(/\s+/g, '-') + '-'
        : 'multiple-buildings-';
      const filename = `panel-logs-${buildingTag}${dateFrom || date || "export"}.xlsx`;
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
      res.send(buffer);
      return;
    }

    const filters = {
      building,
      date,
      dateFrom,
      dateTo,
      panelType,
      time,
    };

    const buffer = await generateExcel(filters);

    const filename = building
      ? `panel-logs-${building.replace(/\s+/g, '-')}-${getISTDateString()}.xlsx`
      : `panel-logs-${getISTDateString()}.xlsx`;
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate Excel file",
      message: error.message,
    });
  }
});

app.get("/api/panel-logs/export/pdf", authMiddleware, async (req, res) => {
  try {
    const { generatePDF } = await import("./services/panelExport.js");
    const userAssignedBuildings = req.user?.assignedBuildings || [];
    let { building, date, dateFrom, dateTo, panelType, time } = req.query;

    // If user is restricted and building is specified, check access
    if (
      userAssignedBuildings.length > 0 &&
      building &&
      !userAssignedBuildings.includes(building)
    ) {
      return res.status(403).json({
        success: false,
        error: "Access denied to export logs for this building",
      });
    }

    // If user is restricted and no building specified, restrict to assigned buildings only
    if (userAssignedBuildings.length > 0 && !building) {
      const filters = {
        buildings: userAssignedBuildings,
        date,
        dateFrom,
        dateTo,
        panelType,
        time,
      };
      const buffer = await generatePDF(filters);
      const buildingTag = userAssignedBuildings.length === 1
        ? userAssignedBuildings[0].replace(/\s+/g, '-') + '-'
        : 'multiple-buildings-';
      const filename = `panel-logs-${buildingTag}${dateFrom || date || "export"}.pdf`;
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
      res.send(buffer);
      return;
    }

    const filters = {
      building,
      date,
      dateFrom,
      dateTo,
      panelType,
      time,
    };

    const buffer = await generatePDF(filters);

    const filename = building
      ? `panel-logs-${building.replace(/\s+/g, '-')}-${getISTDateString()}.pdf`
      : `panel-logs-${getISTDateString()}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    console.error("Error exporting to PDF:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate PDF file",
      message: error.message,
    });
  }
});

app.delete("/api/panel-logs/:id", authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { panelType } = req.query;
    const userAssignedBuildings = req.user?.assignedBuildings || [];

    // Get the log to check building access
    const log = await panelLogService.getPanelLogById(id);
    if (
      log &&
      userAssignedBuildings.length > 0 &&
      !userAssignedBuildings.includes(log.building)
    ) {
      return res.status(403).json({
        success: false,
        error:
          "Access denied. You can only delete logs for your assigned buildings",
      });
    }

    if (panelType && (panelType === "HT" || panelType === "LT")) {
      const result = await panelLogService.deletePanelType(id, panelType);

      if (!result.success) {
        return res.status(404).json({
          success: false,
          error: "Panel log not found",
        });
      }

      return res.json({
        success: true,
        message: result.deleted
          ? "Panel log deleted successfully (was last panel)"
          : `${panelType} panel data removed successfully`,
        fullyDeleted: result.deleted,
      });
    }

    const success = await panelLogService.deletePanelLog(id);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: "Panel log not found",
      });
    }

    res.json({
      success: true,
      message: "Panel log deleted successfully",
      fullyDeleted: true,
    });
  } catch (error) {
    console.error("Error deleting panel log:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
});

app.delete("/api/panel-logs", async (req, res) => {
  try {
    await panelLogService.deleteAllPanelLogs();

    res.json({
      success: true,
      message: "All panel logs deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting all panel logs:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
});

// Removed unused export PDF by building endpoints

// Email API Routes

// Test email connection
app.get("/api/email/test", async (req, res) => {
  try {
    const result = await testEmailConnection();
    if (result.success) {
      res.json({ success: true, message: "Email connection successful" });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Trigger email reports manually (for previous day)
app.post("/api/email/trigger-reports", async (req, res) => {
  try {
    console.log("📧 Manual trigger received for daily email reports");
    const result = await triggerDailyEmailReportManual();
    res.json({
      success: true,
      message: "Email reports triggered successfully",
      result,
    });
  } catch (error) {
    console.error("Error triggering email reports:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Trigger email reports for specific date
app.post("/api/email/trigger-reports/:date", async (req, res) => {
  try {
    const { date } = req.params;

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        error: "Invalid date format. Use YYYY-MM-DD",
      });
    }

    console.log(`📧 Manual trigger received for date: ${date}`);
    const result = await triggerEmailReportForDate(date);
    res.json({
      success: true,
      message: `Email reports triggered for ${date}`,
      result,
    });
  } catch (error) {
    console.error("Error triggering email reports:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get email logs
app.get("/api/email/logs", async (req, res) => {
  try {
    const { building, status, days = 7 } = req.query;

    const where = {};
    if (building) where.building = building;
    if (status) where.status = status;

    // Get logs from last N days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    where.sentAt = { gte: startDate };

    const logs = await prisma.emailLog.findMany({
      where,
      orderBy: { sentAt: "desc" },
      take: 100,
    });

    res.json({ success: true, logs, count: logs.length });
  } catch (error) {
    console.error("Error fetching email logs:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get email configuration (building admin emails)
app.get("/api/email/config/buildings", async (req, res) => {
  try {
    const { getAllBuildingEmails } = await import("./config/buildingEmails.js");
    const buildingEmails = getAllBuildingEmails();
    res.json({ success: true, buildingEmails });
  } catch (error) {
    console.error("Error fetching building emails:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update building admin email (admin only - TODO: add auth middleware)
app.put("/api/email/config/buildings/:building", async (req, res) => {
  try {
    const { building } = req.params;
    const { email, adminName } = req.body;

    // TODO: Add authentication middleware to check if user is admin

    if (!email || !adminName) {
      return res.status(400).json({
        success: false,
        error: "email and adminName are required",
      });
    }

    // TODO: Implement persistent storage for building emails (update backend config or DB)
    // For now, just return success (changes won't persist)
    res.json({
      success: true,
      message: `Building email configuration for ${building} would be updated to ${email}`,
      note: "Note: Email configuration is currently stored in code. Please update backend/config/buildingEmails.js to make changes persistent.",
    });
  } catch (error) {
    console.error("Error updating building email:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

wss.on("connection", (ws) => {
  console.log("Client connected via WebSocket");

  ws.send(
    JSON.stringify({
      type: "liftData",
      data: liftData,
    })
  );

  ws.on("close", () => console.log("Client disconnected"));
  ws.on("error", (error) => console.error("WebSocket error:", error));
});

server.listen(PORT, "0.0.0.0", async () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);

  // Only initialize sample data in development
  if (process.env.NODE_ENV !== "production") {
    await panelLogService.initializeSampleData();
  }

  // Start auto-entry scheduler
  startAutoEntryScheduler();

  // Start STP Device Status Check (1 Minute Timeout) per building
  setInterval(() => {
    const now = Date.now();
    Object.keys(stpStates).forEach(building => {
      const state = stpStates[building];
      if (state.deviceOnline && state.lastUpdated && (now - state.lastUpdated > 60000)) {
        console.log(`STP Device Monitor: Device Offline for ${building} (Timeout > 60s)`);
        state.deviceOnline = false;

        // Broadcast offline update strictly bound to this building
        const message = JSON.stringify({ type: 'stpUpdate', building, data: state });
        wss.clients.forEach(client => {
          if (client.readyState === 1) client.send(message);
        });
      }
    });
  }, 10000); // Check every 10 seconds

  // Initialize and start email scheduler & queue processor
  const emailReady = initializeBrevoTransporter();
  if (emailReady) {
    startEmailScheduler();
    startEmailQueueProcessor(); // Start the email queue processor
  } else {
    console.log(
      "⚠️ Email scheduler not started - check BREVO_API_KEY environment variable"
    );
  }
});

// --- LIFT DYNAMIC CONFIGURATION API ---
app.get("/api/lifts/config/:building", authMiddleware, async (req, res) => {
  try {
    const building = req.params.building.toUpperCase();
    res.json({ panels: liftData[building]?.map(l => l.ID) || [] });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/lifts/config/:building", authMiddleware, async (req, res) => {
  try {
    const building = req.params.building.toUpperCase();
    const { panels } = req.body;

    await prisma.buildingLiftConfig.upsert({
      where: { building },
      update: { panels: panels },
      create: { building, panels: panels }
    });

    const oldData = liftData[building] || [];
    liftData[building] = panels.map(id => {
      const existing = oldData.find(l => l.ID === id);
      return existing ? existing : { ID: id, Fl: "G", Alarm: "0", Door: "0", lastUpdated: Date.now() };
    });

    broadcastWS({ [building]: liftData[building] });
    res.json({ success: true, panels });
  } catch (error) {
    console.error("Config save error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// --- DYNAMIC WHATSAPP NUMBER CONFIGURATION API ---
app.get("/api/whatsapp-numbers/:building", authMiddleware, async (req, res) => {
  try {
    const building = req.params.building.toUpperCase();
    const numbers = await prisma.buildingWhatsappNumber.findMany({ where: { building } });
    res.json({ numbers: numbers.map(n => n.phoneNumber) });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/whatsapp-numbers/:building", authMiddleware, async (req, res) => {
  try {
    const building = req.params.building.toUpperCase();
    const { numbers } = req.body;
    await prisma.buildingWhatsappNumber.deleteMany({ where: { building } });

    if (numbers && numbers.length > 0) {
      const createData = numbers.map(phoneNumber => ({ building, phoneNumber }));
      await prisma.buildingWhatsappNumber.createMany({ data: createData });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// --- GLOBAL EDGE IOT WHATSAPP ALARM ENDPOINT ---
app.get("/api/whatsapp-alarms", async (req, res) => {
  try {
    const response = {};

    // Fetch all numbers dynamically from PostgreSQL in one transaction
    const allNumbers = await prisma.buildingWhatsappNumber.findMany();

    // Map strictly across configured liftData objects loaded in RAM
    for (const building of Object.keys(liftData)) {
      // Filter exclusively for Lift targets emitting Alarm variables
      const activeAlarms = liftData[building].filter(l => String(l.Alarm) === "1");

      // Only append to the JSON block if the building mathematically tracks an active alarm
      if (activeAlarms.length > 0) {
        // Collect exact mobile paths isolated to this exact building object
        const mobileNumbers = allNumbers
          .filter(n => n.building === building)
          .map(n => n.phoneNumber);

        response[building] = {
          Alarm: activeAlarms.map(l => ({
            ID: l.ID,
            Alarm: 1,
            Fl: isNaN(parseInt(l.Fl)) ? l.Fl : parseInt(l.Fl),
            Door: parseInt(l.Door) || 0
          })),
          "Mobile Number": [...new Set(mobileNumbers)]
        };
      }
    }

    res.json(response);
  } catch (error) {
    console.error("WhatsApp Edge API Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

process.on("SIGTERM", () => {
  console.log("Received SIGTERM, shutting down gracefully");
  stopAutoEntryScheduler();
  stopEmailQueueProcessor(); // Stop email queue processor
  server.close(() => process.exit(0));
});

process.on("SIGINT", () => {
  console.log("Received SIGINT, shutting down gracefully");
  stopAutoEntryScheduler();
  stopEmailQueueProcessor(); // Stop email queue processor
  server.close(() => process.exit(0));
});
