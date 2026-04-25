import express from "express";
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
import prisma from '../prismaClient.js';

// Default hardcoded shift times exactly 24h covered
const DEFAULT_SHIFTS = {
    shiftAStart: "00:00",
    shiftAEnd: "07:59",
    shiftBStart: "08:00",
    shiftBEnd: "15:59",
    shiftCStart: "16:00",
    shiftCEnd: "23:59"
};

// GET /api/shifts/config/:building
router.get('/config/:building', authMiddleware, async (req, res) => {
    try {
        const { building } = req.params;

        let config = await prisma.buildingShiftConfig.findUnique({
            where: { building }
        });

        if (!config) {
            // If the building physically has no exact configuration yet, mathematically default to standard
            config = {
                building,
                ...DEFAULT_SHIFTS
            };
        }

        res.json(config);

    } catch (error) {
        console.error("Error fetching shift config:", error);
        res.status(500).json({ error: "Failed to fetch shift configurations." });
    }
});

// POST /api/shifts/config
router.post('/config', authMiddleware, async (req, res) => {
    try {
        const { building, shiftAStart, shiftAEnd, shiftBStart, shiftBEnd, shiftCStart, shiftCEnd } = req.body;
        const updatedBy = req.user.name || req.user.username || "System";

        const updatedConfig = await prisma.buildingShiftConfig.upsert({
            where: { building },
            create: {
                building,
                shiftAStart, shiftAEnd,
                shiftBStart, shiftBEnd,
                shiftCStart, shiftCEnd,
                updatedBy
            },
            update: {
                shiftAStart, shiftAEnd,
                shiftBStart, shiftBEnd,
                shiftCStart, shiftCEnd,
                updatedBy
            }
        });

        res.json({ message: "Shift Configuration updated flawlessly.", config: updatedConfig });
    } catch (error) {
        console.error("Error saving shift config:", error);
        res.status(500).json({ error: "Failed to securely save shift timings." });
    }
});

export default router;
