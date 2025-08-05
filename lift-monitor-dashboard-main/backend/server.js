import express from 'express';
import cors from 'cors';
import compression from 'compression'; // ✅ Add compression for faster responses
import { WebSocketServer } from 'ws';
import { createServer } from 'http';

const app = express();
const PORT = 5001;

// Middleware
app.use(cors({
  origin: ['https://www.atlanwa-prestige.com'], // Allow only your frontend domain
  methods: ['GET', 'POST'],
  credentials: false
}));

app.use(express.json());
app.use(compression()); // ✅ Enable gzip compression

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
    { ID: 'P1', Fl: 'G', Alarm: '0', Door: '0' },
    { ID: 'P2', Fl: 'G', Alarm: '0', Door: '0' },
    { ID: 'P3', Fl: 'G', Alarm: '0', Door: '0' },
    { ID: 'P4', Fl: 'G', Alarm: '0', Door: '0' },
    { ID: 'P5', Fl: 'G', Alarm: '0', Door: '0' },
    { ID: 'P6', Fl: 'G', Alarm: '0', Door: '0' }
  ],
  "PRESTIGE PALLADIUM": [
    { ID: 'P1', Fl: 'G', Alarm: '0', Door: '0' },
    { ID: 'P2', Fl: 'G', Alarm: '0', Door: '0' },
    { ID: 'P3', Fl: 'G', Alarm: '0', Door: '0' },
    { ID: 'P4', Fl: 'G', Alarm: '0', Door: '0' },
    { ID: 'P5', Fl: 'G', Alarm: '0', Door: '0' },
    { ID: 'P6', Fl: 'G', Alarm: '0', Door: '0' }
  ],
  "PRESTIGE METROPOLITAN": [
    { ID: 'P1', Fl: 'G', Alarm: '0', Door: '0' },
    { ID: 'P2', Fl: 'G', Alarm: '0', Door: '0' },
    { ID: 'P3', Fl: 'G', Alarm: '0', Door: '0' },
    { ID: 'P4', Fl: 'G', Alarm: '0', Door: '0' },
    { ID: 'P5', Fl: 'G', Alarm: '0', Door: '0' },
    { ID: 'P6', Fl: 'G', Alarm: '0', Door: '0' }
  ],
  "PRESTIGE COSMOPOLITAN": [
    { ID: 'P1', Fl: 'G', Alarm: '0', Door: '0' },
    { ID: 'P2', Fl: 'G', Alarm: '0', Door: '0' },
    { ID: 'P3', Fl: 'G', Alarm: '0', Door: '0' },
    { ID: 'P4', Fl: 'G', Alarm: '0', Door: '0' },
    { ID: 'P5', Fl: 'G', Alarm: '0', Door: '0' },
    { ID: 'P6', Fl: 'G', Alarm: '0', Door: '0' }
  ],
  "PRESTIGE CYBER TOWERS": [
    { ID: 'P1', Fl: 'G', Alarm: '0', Door: '0' },
    { ID: 'P2', Fl: 'G', Alarm: '0', Door: '0' },
    { ID: 'P3', Fl: 'G', Alarm: '0', Door: '0' },
    { ID: 'P4', Fl: 'G', Alarm: '0', Door: '0' },
    { ID: 'P5', Fl: 'G', Alarm: '0', Door: '0' },
    { ID: 'P6', Fl: 'G', Alarm: '0', Door: '0' }
  ]
};

// ✅ Utility: Broadcast only updated building or changes
const broadcastWS = (update) => {
  const message = JSON.stringify({
    type: 'liftUpdate',
    data: update
  });

  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // OPEN
      client.send(message);
    }
  });
};

// ✅ GET all lifts
app.get('/api/lifts', (req, res) => {
  try {
    res.json(liftData);
  } catch (error) {
    console.error('Error fetching lift data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ GET building list
app.get('/api/buildings', (req, res) => {
  res.json(buildings);
});

// ✅ GET lifts for a specific building
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

// ✅ POST update lift data (supports both formats)
app.post('/api/lifts', (req, res) => {
  try {
    let buildingName = null;
    let lifts = [];

    if (req.body.building && Array.isArray(req.body.lifts)) {
      // Format: { "building": "PRESTIGE POLYGON", "lifts": [ ... ] }
      buildingName = req.body.building.toUpperCase();
      lifts = req.body.lifts;
    } else {
      // Format: { "PRESTIGE POLYGON": { ... } } OR { "PRESTIGE POLYGON": [ ... ] }
      const keys = Object.keys(req.body);
      if (keys.length > 0) {
        buildingName = keys[0].toUpperCase();
        lifts = Array.isArray(req.body[keys[0]]) ? req.body[keys[0]] : [req.body[keys[0]]];
      }
    }

    if (!buildingName || !liftData[buildingName]) {
      return res.status(400).json({ error: 'Invalid building name or format' });
    }

    // ✅ Update the data
    liftData[buildingName] = lifts;

    // ✅ Broadcast only updated building data
    broadcastWS({ [buildingName]: lifts });

    // ✅ Send small response
    res.json({ message: 'Lift data updated', updated: buildingName });
  } catch (error) {
    console.error('Error updating lift data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ✅ WebSocket connections
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

// ✅ Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend running on port ${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}/api/lifts`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
});

// ✅ Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  server.close(() => process.exit(0));
});
