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

// Generate simulated lift data
const generateLiftData = () => {
  const currentTime = Date.now();
  const variation = Math.floor(currentTime / 5000) % 3; // Changes every 5 seconds
  
  return {
    "PRESTIGE POLYGON": [
      { ID: 'P1', Fl: '2', Alarm: '1', Door: '0' }, // Alarm = in service, no movement
      { ID: 'P2', Fl: '5', Alarm: '0', Door: '1' }, // Door open = stationary
      { ID: 'P3', Fl: String(Math.max(1, 9 - variation)), Alarm: '0', Door: '0' } // Moving down
    ],
    "PRESTIGE PALLADIUM": [
      { ID: 'P1', Fl: String(3 + variation), Alarm: '0', Door: '0' }, // Moving up
      { ID: 'P2', Fl: '5', Alarm: '0', Door: '1' }, // Door open = stationary
    ],
    "PRESTIGE METROPOLITAN": [
      { ID: 'P1', Fl: String(Math.max(1, 8 - variation)), Alarm: '0', Door: '0' }, // Moving down
      { ID: 'P2', Fl: '10', Alarm: '1', Door: '0' }, // Alarm = in service
      { ID: 'P3', Fl: '12', Alarm: '0', Door: '1' } // Door open = stationary
    ],
    "PRESTIGE COSMOPOLITAN": [
      { ID: 'P1', Fl: String(Math.max(1, 8 - variation)), Alarm: '0', Door: '0' }, // Moving down
      { ID: 'P2', Fl: '15', Alarm: '1', Door: '1' }, // Alarm = in service, no movement
      { ID: 'P3', Fl: String(3 + variation), Alarm: '0', Door: '0' } // Moving up
    ],
    "PRESTIGE CYBER TOWERS": [
      { ID: 'P1', Fl: String(5 + variation), Alarm: '0', Door: '0' }, // Moving up
      { ID: 'P2', Fl: '7', Alarm: '0', Door: '1' }, // Door open = stationary
      { ID: 'P3', Fl: String(Math.max(1, 12 - variation)), Alarm: '0', Door: '0' }, // Moving down
      { ID: 'P4', Fl: '1', Alarm: '1', Door: '0' } // Alarm = in service
    ]
  };
};

// API Routes
app.get('/api/lifts', (req, res) => {
  try {
    const liftData = generateLiftData();
    res.json(liftData);
  } catch (error) {
    console.error('Error generating lift data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/buildings', (req, res) => {
  res.json(buildings);
});

app.get('/api/lifts/:building', (req, res) => {
  try {
    const building = req.params.building.toUpperCase();
    const liftData = generateLiftData();
    
    if (liftData[building]) {
      res.json({ [building]: liftData[building] });
    } else {
      res.status(404).json({ error: 'Building not found' });
    }
  } catch (error) {
    console.error('Error getting building data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// WebSocket connection for real-time updates
wss.on('connection', (ws) => {
  console.log('Client connected via WebSocket');
  
  // Send initial data
  ws.send(JSON.stringify({
    type: 'liftData',
    data: generateLiftData()
  }));
  
  // Send updates every 5 seconds
  const interval = setInterval(() => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({
        type: 'liftData',
        data: generateLiftData()
      }));
    }
  }, 5000);
  
  ws.on('close', () => {
    console.log('Client disconnected');
    clearInterval(interval);
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clearInterval(interval);
  });
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Lift Monitor Backend running on port ${PORT}`);
  console.log(`📡 HTTP API: http://localhost:${PORT}/api/lifts`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
  console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
