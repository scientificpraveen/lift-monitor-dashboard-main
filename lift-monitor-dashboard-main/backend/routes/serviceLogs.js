import express from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware, optionalAuthMiddleware } from "../middleware/auth.js";

const router = express.Router();
const prisma = new PrismaClient();

router.use(optionalAuthMiddleware);

router.get("/", async (req, res) => {
  try {
    const logs = await prisma.serviceLog.findMany({
      orderBy: { createdAt: "desc" },
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
      date,
      time,
      workOrderNo,
      natureOfCall,
      workDescription,
      status,
      username,
    } = req.body;

    if (
      !sno ||
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
        date,
        time,
        workOrderNo: workOrderNo || null,
        natureOfCall,
        workDescription,
        status,
        username,
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
      date,
      time,
      workOrderNo,
      natureOfCall,
      workDescription,
      status,
      username,
      lastUpdatedBy,
      lastUpdatedAt,
    } = req.body;

    const log = await prisma.serviceLog.update({
      where: { id: parseInt(id) },
      data: {
        sno,
        date,
        time,
        workOrderNo: workOrderNo || null,
        natureOfCall,
        workDescription,
        status,
        username,
        lastUpdatedBy: lastUpdatedBy || null,
        lastUpdatedAt: lastUpdatedAt ? new Date(lastUpdatedAt) : null,
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
