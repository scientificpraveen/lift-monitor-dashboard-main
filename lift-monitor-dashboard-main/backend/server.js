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

const app = express();
const PORT = process.env.PORT || 3001;

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
app.use("/api/users", userRoutes);

const server = createServer(app);

const wss = new WebSocketServer({ server, path: "/ws" });

const buildings = [
  "PRESTIGE POLYGON",
  "PRESTIGE PALLADIUM",
  "PRESTIGE METROPOLITAN",
  "PRESTIGE COSMOPOLITAN",
  "PRESTIGE CYBER TOWERS",
];

let liftData = {
  "PRESTIGE POLYGON": [
    { ID: "P1", Fl: "G", Alarm: "0", Door: "0" },
    { ID: "P2", Fl: "G", Alarm: "0", Door: "0" },
    { ID: "P3", Fl: "G", Alarm: "0", Door: "0" },
    { ID: "P4", Fl: "G", Alarm: "0", Door: "0" },
    { ID: "P5", Fl: "G", Alarm: "0", Door: "0" },
    { ID: "P6", Fl: "G", Alarm: "0", Door: "0" },
  ],
  "PRESTIGE PALLADIUM": [
    { ID: "P1", Fl: "G", Alarm: "0", Door: "0" },
    { ID: "P2", Fl: "G", Alarm: "0", Door: "0" },
    { ID: "P3", Fl: "G", Alarm: "0", Door: "0" },
    { ID: "P4", Fl: "G", Alarm: "0", Door: "0" },
    { ID: "P5", Fl: "G", Alarm: "0", Door: "0" },
    { ID: "P6", Fl: "G", Alarm: "0", Door: "0" },
  ],
  "PRESTIGE METROPOLITAN": [
    { ID: "P1", Fl: "G", Alarm: "0", Door: "0" },
    { ID: "P2", Fl: "G", Alarm: "0", Door: "0" },
    { ID: "P3", Fl: "G", Alarm: "0", Door: "0" },
    { ID: "P4", Fl: "G", Alarm: "0", Door: "0" },
    { ID: "P5", Fl: "G", Alarm: "0", Door: "0" },
    { ID: "P6", Fl: "G", Alarm: "0", Door: "0" },
  ],
  "PRESTIGE COSMOPOLITAN": [
    { ID: "P1", Fl: "G", Alarm: "0", Door: "0" },
    { ID: "P2", Fl: "G", Alarm: "0", Door: "0" },
    { ID: "P3", Fl: "G", Alarm: "0", Door: "0" },
    { ID: "P4", Fl: "G", Alarm: "0", Door: "0" },
    { ID: "P5", Fl: "G", Alarm: "0", Door: "0" },
    { ID: "P6", Fl: "G", Alarm: "0", Door: "0" },
  ],
  "PRESTIGE CYBER TOWERS": [
    { ID: "P1", Fl: "G", Alarm: "0", Door: "0" },
    { ID: "P2", Fl: "G", Alarm: "0", Door: "0" },
    { ID: "P3", Fl: "G", Alarm: "0", Door: "0" },
    { ID: "P4", Fl: "G", Alarm: "0", Door: "0" },
    { ID: "P5", Fl: "G", Alarm: "0", Door: "0" },
    { ID: "P6", Fl: "G", Alarm: "0", Door: "0" },
  ],
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
    res.json(liftData);
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
      res.json({ [building]: liftData[building] });
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

    liftData[buildingName] = lifts;

    broadcastWS({ [buildingName]: lifts });

    res.json({ message: "Lift data updated", updated: buildingName });
  } catch (error) {
    console.error("Error updating lift data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
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
    const today = new Date().toISOString().split("T")[0];

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

app.get("/api/panel-logs", async (req, res) => {
  try {
    const { building, date, dateFrom, dateTo, panelType, time } = req.query;

    const filters = {};
    if (building) filters.building = building;
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

app.get("/api/panel-logs/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const log = await panelLogService.getPanelLogById(id);

    if (!log) {
      return res.status(404).json({
        success: false,
        error: "Panel log not found",
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

app.post("/api/panel-logs", async (req, res) => {
  try {
    const logData = req.body;

    if (!logData.building || !logData.date || !logData.time) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: building, date, and time are required",
      });
    }

    const newLog = await panelLogService.createPanelLog(logData);

    res.status(201).json({
      success: true,
      message: "Panel log created successfully",
      data: newLog,
    });
  } catch (error) {
    console.error("Error creating panel log:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
});

app.put("/api/panel-logs/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const logData = req.body;

    const updatedLog = await panelLogService.updatePanelLog(id, logData);

    if (!updatedLog) {
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

app.get("/api/panel-logs/export/excel", async (req, res) => {
  try {
    const { generateExcel } = await import("./services/panelExport.js");

    const filters = {
      building: req.query.building,
      date: req.query.date,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      panelType: req.query.panelType,
      time: req.query.time,
    };

    const buffer = await generateExcel(filters);

    const filename = `panel-logs-${
      new Date().toISOString().split("T")[0]
    }.xlsx`;
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

app.get("/api/panel-logs/export/pdf", async (req, res) => {
  try {
    const { generatePDF } = await import("./services/panelExport.js");

    const filters = {
      building: req.query.building,
      date: req.query.date,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      panelType: req.query.panelType,
      time: req.query.time,
    };

    const buffer = await generatePDF(filters);

    const filename = `panel-logs-${new Date().toISOString().split("T")[0]}.pdf`;
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

app.delete("/api/panel-logs/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { panelType } = req.query;

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

app.get("/api/panel-logs/export/excel", async (req, res) => {
  try {
    const { building, date, dateFrom, dateTo, panelType, time } = req.query;

    const filters = {};
    if (building) filters.building = building;
    if (date) filters.date = date;
    if (dateFrom || dateTo) {
      filters.dateRange = { from: dateFrom, to: dateTo };
    }
    if (panelType) filters.panelType = panelType;
    if (time) filters.time = time;

    const logs = await panelLogService.getPanelLogs(filters);
    const buffer = generateExcelReport(logs);

    const filename = `Panel_Logs_${date || dateFrom || "export"}.xlsx`;

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
      error: "Failed to export to Excel",
      message: error.message,
    });
  }
});

app.get("/api/panel-logs/export/pdf", async (req, res) => {
  try {
    const { building, date, dateFrom, dateTo, panelType, time } = req.query;

    const filters = {};
    if (building) filters.building = building;
    if (date) filters.date = date;
    if (dateFrom || dateTo) {
      filters.dateRange = { from: dateFrom, to: dateTo };
    }
    if (panelType) filters.panelType = panelType;
    if (time) filters.time = time;

    const logs = await panelLogService.getPanelLogs(filters);
    const buffer = await generatePDFReport(logs);

    const filename = `Panel_Logs_${date || dateFrom || "export"}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    console.error("Error exporting to PDF:", error);
    res.status(500).json({
      success: false,
      error: "Failed to export to PDF",
      message: error.message,
    });
  }
});

// Export PDFs grouped by building
app.get("/api/panel-logs/export/pdf/by-building", async (req, res) => {
  try {
    const { building, date, dateFrom, dateTo, panelType, time } = req.query;

    const filters = {};
    if (building) filters.building = building;
    if (date) filters.date = date;
    if (dateFrom || dateTo) {
      filters.dateRange = { from: dateFrom, to: dateTo };
    }
    if (panelType) filters.panelType = panelType;
    if (time) filters.time = time;

    const logs = await panelLogService.getPanelLogs(filters);

    if (logs.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No data available for export",
      });
    }

    const { generatePDFByBuilding } = await import("./exportService.js");
    const pdfsByBuilding = await generatePDFByBuilding(logs);

    // If single building requested, return single PDF
    if (building && pdfsByBuilding[building]) {
      const filename = `Panel_Logs_${building}_${
        date || dateFrom || "export"
      }.pdf`;
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
      res.send(pdfsByBuilding[building]);
    } else {
      // Return JSON with building information
      res.json({
        success: true,
        buildings: Object.keys(pdfsByBuilding),
        message:
          "PDFs generated for each building. Use individual endpoints to download.",
        count: Object.keys(pdfsByBuilding).length,
      });
    }
  } catch (error) {
    console.error("Error exporting PDFs by building:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate PDF files",
      message: error.message,
    });
  }
});

// Download individual building PDF
app.get(
  "/api/panel-logs/export/pdf/building/:buildingName",
  async (req, res) => {
    try {
      const buildingName = decodeURIComponent(req.params.buildingName);
      const { date, dateFrom, dateTo, panelType, time } = req.query;

      const filters = {
        building: buildingName,
      };
      if (date) filters.date = date;
      if (dateFrom || dateTo) {
        filters.dateRange = { from: dateFrom, to: dateTo };
      }
      if (panelType) filters.panelType = panelType;
      if (time) filters.time = time;

      const logs = await panelLogService.getPanelLogs(filters);

      if (logs.length === 0) {
        return res.status(404).json({
          success: false,
          error: "No data found for this building",
        });
      }

      const { generatePDFByBuilding } = await import("./exportService.js");
      const pdfsByBuilding = await generatePDFByBuilding(logs);

      if (pdfsByBuilding[buildingName]) {
        const filename = `Panel_Logs_${buildingName}_${
          date || dateFrom || "export"
        }.pdf`;
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${filename}"`
        );
        res.send(pdfsByBuilding[buildingName]);
      } else {
        res.status(404).json({
          success: false,
          error: "PDF generation failed for this building",
        });
      }
    } catch (error) {
      console.error("Error exporting PDF for building:", error);
      res.status(500).json({
        success: false,
        error: "Failed to generate PDF file",
        message: error.message,
      });
    }
  }
);

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
