import express from "express";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();
const prisma = new PrismaClient();

// Middleware to check if user is admin
const adminMiddleware = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// Get all users (admin only)
router.get("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        panelLogPrivileges: true,
        serviceLogPrivileges: true,
        assignedBuildings: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Get single user (admin only)
router.get("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        panelLogPrivileges: true,
        serviceLogPrivileges: true,
        assignedBuildings: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// Create new user (admin only)
router.post("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const {
      username,
      password,
      name,
      role,
      panelLogPrivileges,
      serviceLogPrivileges,
      assignedBuildings,
    } = req.body;

    if (!username || !password || !name) {
      return res
        .status(400)
        .json({ error: "Username, password, and name are required" });
    }

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return res.status(409).json({ error: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        role: role || "user",
        panelLogPrivileges: panelLogPrivileges || ["view"],
        serviceLogPrivileges: serviceLogPrivileges || ["view"],
        assignedBuildings: assignedBuildings || [],
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        panelLogPrivileges: true,
        serviceLogPrivileges: true,
        assignedBuildings: true,
        createdAt: true,
      },
    });

    res.status(201).json(user);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

// Update user (admin only)
router.put("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      username,
      name,
      role,
      panelLogPrivileges,
      serviceLogPrivileges,
      assignedBuildings,
      password,
    } = req.body;

    console.log("Update request received for user ID:", id);
    console.log("Payload:", req.body);
    console.log(
      "panelLogPrivileges:",
      panelLogPrivileges,
      "Type:",
      typeof panelLogPrivileges
    );
    console.log(
      "serviceLogPrivileges:",
      serviceLogPrivileges,
      "Type:",
      typeof serviceLogPrivileges
    );

    const updateData = {};
    if (username) updateData.username = username;
    if (name) updateData.name = name;
    if (role) updateData.role = role;
    if (panelLogPrivileges !== undefined)
      updateData.panelLogPrivileges = panelLogPrivileges;
    if (serviceLogPrivileges !== undefined)
      updateData.serviceLogPrivileges = serviceLogPrivileges;
    if (assignedBuildings !== undefined)
      updateData.assignedBuildings = assignedBuildings;
    if (password) updateData.password = await bcrypt.hash(password, 10);

    console.log("Final updateData:", updateData);

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        panelLogPrivileges: true,
        serviceLogPrivileges: true,
        assignedBuildings: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// Delete user (admin only)
router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }

    await prisma.user.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

export default router;
