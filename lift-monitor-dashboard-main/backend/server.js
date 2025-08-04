import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Create HTTP server
const server = createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Buildings configuration
const buildings = [
  "PRESTIGE POLYGON",
  "PRESTIGE PALLADIUM",
  "PRESTIGE METROPOLITAN",
  "PRESTIGE COSMOPOLITAN",
  "PRESTIGE CYBER TOWERS"
];

// Initial Lift Data
let liftData = {
  "PRESTIGE POLYGON": [
    { ID: 'P1', Fl: '2', Alarm: '1', Door: '0' },
    { ID: 'P2', Fl: '5', Alarm: '0', Door: '1' },
    { ID: 'P3', Fl: '9', Alarm: '0', Door: '0' }
  ],
  "PRESTIGE PALLADIUM": [
    { ID: 'P1', Fl: '3', Alarm: '0', Door: '0' },
    { ID: 'P2', Fl: '5', Alarm: '0', Door: '1' }
  ],
  "PRESTIGE METROPOLITAN": [
    { ID: 'P1', Fl: '8', Alarm: '0', Door: '0' },
    { ID: 'P2', Fl: '10', Alarm: '1', Door: '0' },
    { ID: 'P3', Fl: '12', Alarm: '0', Door: '1' }
  ],
  "PRESTIGE COSMOPOLITAN": [
    { ID: 'P1', Fl: '8', Alarm: '0', Door: '0' },
    { ID: 'P2', Fl: '15', Alarm: '1', Door: '1' },
    { ID: 'P3', Fl: '3', Alarm: '0', Door: '0' }
  ],
  "PRESTIGE CYBER TOWERS": [
    { ID: 'P1', Fl: '5', Alarm: '0', Door: '0' },
    { ID: 'P2', Fl: '7', Alarm: '0', Door: '1' },
    { ID: 'P3', Fl: '12', Alarm: '0', Door: '0' },
    { ID: 'P4', Fl: '1', Alarm: '1', Door: '0' }
  ]
};

// Utility: Broadcast updated data to all WebSocket clients
const broadcastWS = (data) => {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // OPEN
      client.send(JSON.stringify({
        type: 'liftData',
        data
      }));
    }
  });
};

// GET all lifts
app.get('/api/lifts', (req, res) => {
  try {
    res.json(liftData);
  } catch (error) {
    console.error('Error fetching lift data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET building list
app.get('/api/buildings', (req, res) => {
  res.json(buildings);
});

// GET lifts for a specific building
app.get('/api/lifts/:building', (req, res) => {
  try {
    const building = req.params.building.toUpperCase();
    if (liftData[building]) {
      res.json({ [building]: liftData[building] });
    } else {
      res.status(404).json({ error: 'Building not found' });
    }
  } catch (error) {
    console.error('Error fetching building data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ POST update lift data
app.post('/api/lifts', (req, res) => {
  try {
    const { building, lifts } = req.body;
    if (!building || !lifts || !Array.isArray(lifts)) {
      return res.status(400).json({ error: 'Invalid request: building and lifts array are required' });
    }

    const buildingName = building.toUpperCase();
    if (!liftData[buildingName]) {
      return res.status(404).json({ error: 'Building not found' });
    }

    // Update lift data
    liftData[buildingName] = lifts;

    // Broadcast to all WebSocket clients
    broadcastWS(liftData);

    res.json({ message: 'Lift data updated successfully', data: liftData });
  } catch (error) {
    console.error('Error updating lift data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// WebSocket connections
wss.on('connection', (ws) => {
  console.log('✅ Client connected via WebSocket');

  // Send current data immediately
  ws.send(JSON.stringify({
    type: 'liftData',
    data: liftData
  }));

  ws.on('close', () => console.log('❌ Client disconnected'));
  ws.on('error', (error) => console.error('WebSocket error:', error));
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend running on port ${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}/api/lifts`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  server.close(() => process.exit(0));
});
