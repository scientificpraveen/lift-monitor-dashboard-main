import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// --- Fire Data Mapping (Admin Only) ---

// Get all mappings (Filtered by building)
router.get('/mapping', authMiddleware, async (req, res) => {
    try {
        const { building } = req.query;
        // User access check
        const user = req.user;
        const assignedBuildings = user.assignedBuildings || [];

        // If user has restricted access, ensure they can only view their buildings
        if (assignedBuildings.length > 0) {
            if (building && !assignedBuildings.includes(building)) {
                return res.status(403).json({ success: false, error: "Access denied: Building not assigned" });
            }
        }

        const where = {};
        if (building) where.building = building;
        // If no building specified but user is restricted, filter by their list
        if (!building && assignedBuildings.length > 0) {
            where.building = { in: assignedBuildings };
        }

        const mappings = await prisma.fireDataMapping.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, data: mappings });
    } catch (error) {
        console.error('Error fetching fire mappings:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Create new mapping (Admin Only)
router.post('/mapping', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: "Access denied: Admin only" });
        }

        const { tagId, building, location, floor, type } = req.body;

        // Validation
        if (!tagId || !building || !location || !floor || !type) {
            return res.status(400).json({ success: false, error: "All fields form required" });
        }

        // Validate Type Enum (though stored as string)
        const validTypes = ["Hose Reel Hose", "Fire Hydrant cabinet", "External Yard Hydrant"];
        if (!validTypes.includes(type)) {
            return res.status(400).json({ success: false, error: "Invalid Type selection" });
        }

        // Check Duplicate Tag
        const existing = await prisma.fireDataMapping.findUnique({
            where: { tagId }
        });
        if (existing) {
            return res.status(400).json({ success: false, error: "Tag ID already exists" });
        }

        const newMapping = await prisma.fireDataMapping.create({
            data: { tagId, building, location, floor, type }
        });

        res.status(201).json({ success: true, data: newMapping });

    } catch (error) {
        console.error('Error creating fire mapping:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Update mapping (Admin Only)
router.put('/mapping/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: "Access denied: Admin only" });
        }

        const { id } = req.params;
        const { location, floor, type } = req.body; // TagId and Building typically static or restricted

        // Validate Type if updated
        if (type) {
            const validTypes = ["Hose Reel Hose", "Fire Hydrant cabinet", "External Yard Hydrant"];
            if (!validTypes.includes(type)) {
                return res.status(400).json({ success: false, error: "Invalid Type selection" });
            }
        }

        const updated = await prisma.fireDataMapping.update({
            where: { id: parseInt(id) },
            data: { location, floor, type }
        });

        res.json({ success: true, data: updated });

    } catch (error) {
        console.error('Error updating fire mapping:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Delete mapping (Admin Only)
router.delete('/mapping/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: "Access denied: Admin only" });
        }

        const { id } = req.params;
        await prisma.fireDataMapping.delete({
            where: { id: parseInt(id) }
        });

        res.json({ success: true, message: "Mapping deleted" });

    } catch (error) {
        console.error('Error deleting fire mapping:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// --- Fire Checklist Questions (Admin Only) ---

// Get questions (filtered by type and building)
router.get('/questions', authMiddleware, async (req, res) => {
    try {
        const { type, building } = req.query;
        if (!type || !building) {
            return res.status(400).json({ success: false, error: "Type and Building parameters are required" });
        }

        const questions = await prisma.fireQuestion.findMany({
            where: {
                type: type,
                building: building
            },
            orderBy: { id: 'asc' }
        });
        res.json({ success: true, data: questions });
    } catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Create new question (Admin Only)
router.post('/questions', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: "Access denied: Admin only" });
        }

        const { type, question, building, option1, option2, option3 } = req.body;
        if (!type || !question || !building) {
            return res.status(400).json({ success: false, error: "Type, Question, and Building are required" });
        }

        const newQuestion = await prisma.fireQuestion.create({
            data: { type, question, building, option1, option2, option3 }
        });
        res.status(201).json({ success: true, data: newQuestion });

    } catch (error) {
        console.error('Error creating question:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Update question (Admin Only)
router.put('/questions/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: "Access denied: Admin only" });
        }

        const { id } = req.params;
        const { question, option1, option2, option3 } = req.body;

        const updated = await prisma.fireQuestion.update({
            where: { id: parseInt(id) },
            data: { question, option1, option2, option3 }
        });
        res.json({ success: true, data: updated });

    } catch (error) {
        console.error('Error updating question:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Delete question (Admin Only)
router.delete('/questions/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: "Access denied: Admin only" });
        }

        const { id } = req.params;
        await prisma.fireQuestion.delete({
            where: { id: parseInt(id) }
        });
        res.json({ success: true, message: "Question deleted" });

    } catch (error) {
        console.error('Error deleting question:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

import bcrypt from 'bcryptjs';

// --- Mobile App API ---

// 1. Mobile Scan Tag & Fetch Questions (fire-questions-scan)
router.post('/mobile/fire-questions-scan', async (req, res) => {
    try {
        const { tag_id, building_name } = req.body;

        if (!tag_id || !building_name) {
            return res.status(200).json({ success: false, message: "Tag ID and Building Name are required" });
        }

        // 1. Validate Tag exists
        const mapping = await prisma.fireDataMapping.findUnique({ where: { tagId: tag_id } });
        if (!mapping) {
            return res.status(200).json({ success: false, message: "Tag_ID Not Found" });
        }

        // 2. Validate Building Mapping
        // Ensure exact string match
        if (mapping.building !== building_name) {
            return res.status(200).json({ success: false, message: "Tag_ID has been mapped with some other building." });
        }

        // 3. Fetch Questions for this Building & Type
        const questions = await prisma.fireQuestion.findMany({
            where: {
                building: mapping.building,
                type: mapping.type
            },
            orderBy: { id: 'asc' },
            select: {
                question: true,
                option1: true,
                option2: true,
                option3: true
            }
        });

        // 4. Return Response
        res.json({
            success: true,
            message: "Success",
            questions: questions
        });

    } catch (error) {
        console.error('Mobile Scan Error:', error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

// 2. Submit Fire Log (fire-log-submit)
router.post('/mobile/fire-log-submit', async (req, res) => {
    try {
        const { tag_id, building_name, username, type, questions } = req.body;

        if (!tag_id || !building_name || !username || !type) {
            return res.status(200).json({ success: false, message: "Missing required fields" });
        }

        // Validate Tag (Safety check, though client should have scanned)
        const mapping = await prisma.fireDataMapping.findUnique({ where: { tagId: tag_id } });
        if (!mapping) {
            return res.status(200).json({ success: false, message: "Tag ID not found" });
        }

        if (mapping.building !== building_name) {
            return res.status(200).json({ success: false, message: "Tag mapped with other building" });
        }

        // IST Timestamp Conversion
        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istTime = new Date(now.getTime() + istOffset);

        // Create Log Entry
        const newLog = await prisma.fireLogEntry.create({
            data: {
                userName: username,
                building: building_name,
                location: mapping.location,
                floor: mapping.floor,
                type: type,
                answers: questions || {}, // JSON of "Question": "Answer"
                remarks: req.body.remarks || "-",
                timestamp: istTime
            }
        });

        res.json({ success: true, message: "Success", logId: newLog.id });

    } catch (error) {
        console.error('Mobile Submit Error:', error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

// --- Dashboard Log View ---

// Get Logs (Filtered)
router.get('/logs', authMiddleware, async (req, res) => {
    try {
        const { building, type } = req.query;
        if (!building || !type) {
            return res.status(400).json({ success: false, error: "Building and Type are required" });
        }

        const logs = await prisma.fireLogEntry.findMany({
            where: { building, type },
            orderBy: { timestamp: 'desc' }
        });

        res.json({ success: true, data: logs });

    } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Update Log (Admin Only)
router.put('/logs/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: "Access denied: Admin only" });
        }

        const { id } = req.params;
        const { answers, remarks } = req.body;

        const updated = await prisma.fireLogEntry.update({
            where: { id: parseInt(id) },
            data: {
                answers, // Expecting JSON object
                remarks
            }
        });

        res.json({ success: true, data: updated });

    } catch (error) {
        console.error('Error updating log:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Delete Log (Admin Only)
router.delete('/logs/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: "Access denied: Admin only" });
        }

        const { id } = req.params;
        await prisma.fireLogEntry.delete({
            where: { id: parseInt(id) }
        });

        res.json({ success: true, message: "Log deleted" });

    } catch (error) {
        console.error('Error deleting log:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

export default router;
