// API base URL - update this to match your backend server
const API_BASE_URL = '/api';
const WS_BASE_URL = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`;

export const fetchLiftData = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/lifts`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching lift data:', error);
    
    // Fallback to simulated data if API is not available
    console.log('Falling back to simulated data...');
    return simulatedLiftData();
  }
};

// Keep the original simulated data as fallback
const simulatedLiftData = () => {
  // Simulate changing floors for testing direction logic
  const currentTime = Date.now();
  const variation = Math.floor(currentTime / 5000) % 3; // Changes every 5 seconds
  return {
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
};

// WebSocket connection for real-time updates
export const connectWebSocket = (onMessage) => {
  let ws;

  const connect = () => {
    ws = new WebSocket(WS_BASE_URL);

    ws.onopen = () => {
      console.log('Connected to WebSocket server');
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'liftData') {
          // Initial full data load
          onMessage(message.data, 'full');
        } else if (message.type === 'liftUpdate') {
          // Incremental update (only updated building)
          onMessage(message.data, 'update');
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed, retrying in 3s...');
      setTimeout(connect, 3000); // Auto-reconnect
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      ws.close();
    };
  };

  connect();
  return () => ws && ws.close(); // Return cleanup function
};
