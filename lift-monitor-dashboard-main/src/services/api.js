// API base URL - update this to match your backend server
const API_BASE_URL = 'http://143.244.132.186:3001/api';

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
      { ID: 'P1', Fl: '13', Alarm: '1', Door: '0' }, // Alarm = in service, no movement
      { ID: 'P2', Fl: '5', Alarm: '0', Door: '1' }, // Door open = stationary
      { ID: 'P3', Fl: String(9 - variation), Alarm: '0', Door: '0' } // Moving down
    ],
    "PRESTIGE PALLADIUM": [
      { ID: 'P2', Fl: '5', Alarm: '0', Door: '1' }, // Door open = stationary
    ],

    "PRESTIGE METROPOLITAN": [
      { ID: 'P6', Fl: '12', Alarm: '0', Door: '1' } // Door open = stationary
    ],
    "PRESTIGE COSMOPOLITAN": [
      { ID: 'P1', Fl: String(8 - variation), Alarm: '0', Door: '0' }, // Moving down
      { ID: 'P2', Fl: '15', Alarm: '1', Door: '1' }, // Alarm = in service, no movement
      { ID: 'P3', Fl: String(3 + variation), Alarm: '0', Door: '0' } // Moving up
    ]
  };
};

// WebSocket connection for real-time updates
export const connectWebSocket = (onMessage) => {
  const ws = new WebSocket('ws://localhost:3001');
  
  ws.onopen = () => {
    console.log('Connected to WebSocket server');
  };
  
  ws.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      if (message.type === 'liftData') {
        onMessage(message.data);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };
  
  ws.onclose = () => {
    console.log('WebSocket connection closed');
  };
  
  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
  
  return ws;
};