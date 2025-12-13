import express from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware, optionalAuthMiddleware } from "../middleware/auth.js";

const router = express.Router();
const prisma = new PrismaClient();

router.use(optionalAuthMiddleware);

// Get all logs with their history
router.get("/", async (req, res) => {
  try {
    const logs = await prisma.serviceLog.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        history: {
          orderBy: { changedAt: "desc" },
        },
      },
    });
    res.json(logs);
  } catch (error) {
    console.error("Error fetching service logs:", error);
    res.status(500).json({ error: "Failed to fetch service logs" });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      sno,
      building,
      date,
      time,
      natureOfCall,
      workDescription,
      status,
      username,
    } = req.body;

    if (
      !sno ||
      !building ||
      !date ||
      !time ||
      !natureOfCall ||
      !workDescription ||
      !status ||
      !username
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const log = await prisma.serviceLog.create({
      data: {
        sno,
        building,
        date,
        time,
        natureOfCall,
        workDescription,
        status,
        username,
        // Create initial history entry
        history: {
          create: {
            changeType: "created",
            changeDescription: "Log created",
            changedBy: username,
            oldValue: null,
            newValue: JSON.stringify({ status, natureOfCall }),
          },
        },
      },
      include: {
        history: true,
      },
    });

    res.status(201).json(log);
  } catch (error) {
    console.error("Error creating service log:", error);
    res.status(500).json({ error: "Failed to create service log" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      sno,
      building,
      date,
      time,
      natureOfCall,
      workDescription,
      status,
      username,
      lastUpdatedBy,
    } = req.body;

    // Fetch the existing log to compare changes
    const existingLog = await prisma.serviceLog.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingLog) {
      return res.status(404).json({ error: "Service log not found" });
    }

    // Build change descriptions and history entries
    const historyEntries = [];
    const changes = [];

    if (existingLog.status !== status) {
      const changeDesc = `Status: ${existingLog.status} → ${status}`;
      changes.push(changeDesc);
      historyEntries.push({
        changeType: "status_change",
        changeDescription: changeDesc,
        changedBy: lastUpdatedBy || username,
        oldValue: existingLog.status,
        newValue: status,
      });
    }

    if (existingLog.natureOfCall !== natureOfCall) {
      const changeDesc = `Nature: ${existingLog.natureOfCall} → ${natureOfCall}`;
      changes.push(changeDesc);
      historyEntries.push({
        changeType: "nature_change",
        changeDescription: changeDesc,
        changedBy: lastUpdatedBy || username,
        oldValue: existingLog.natureOfCall,
        newValue: natureOfCall,
      });
    }

    if (existingLog.workDescription !== workDescription) {
      changes.push("Description updated");
      historyEntries.push({
        changeType: "description_change",
        changeDescription: "Description updated",
        changedBy: lastUpdatedBy || username,
        oldValue: existingLog.workDescription,
        newValue: workDescription,
      });
    }

    const changeDescription = changes.length > 0 ? changes.join(", ") : null;

    // Update the log and create history entries
    const log = await prisma.serviceLog.update({
      where: { id: parseInt(id) },
      data: {
        sno,
        building,
        date,
        time,
        natureOfCall,
        workDescription,
        status,
        username,
        lastUpdatedBy: lastUpdatedBy || null,
        // Remove lastUpdatedAt - Prisma automatically updates updatedAt
        changeDescription,
        // Create history entries for each change
        history: {
          create: historyEntries,
        },
      },
      include: {
        history: {
          orderBy: { changedAt: "desc" },
        },
      },
    });

    res.json(log);
  } catch (error) {
    console.error("Error updating service log:", error);
    res.status(500).json({ error: "Failed to update service log" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.serviceLog.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "Service log deleted" });
  } catch (error) {
    console.error("Error deleting service log:", error);
    res.status(500).json({ error: "Failed to delete service log" });
  }
});

export default router;
