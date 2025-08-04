export const fetchLiftData = async () => {
  // Simulate changing floors for testing direction logic
  const currentTime = Date.now();
  const variation = Math.floor(currentTime / 5000) % 3; // Changes every 5 seconds
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        "Belly 1": [
          { ID: 'P1', Fl: '13', Alarm: '1', Door: '0' }, // Alarm = in service, no movement
          { ID: 'P2', Fl: '5', Alarm: '0', Door: '1' }, // Door open = stationary
          { ID: 'P3', Fl: String(9 - variation), Alarm: '0', Door: '0' } // Moving down
        ],
        "Belly 2": [
          { ID: 'P4', Fl: '1', Alarm: '1', Door: '1' }, // Alarm = in service, no movement
          { ID: 'P5', Fl: String(6 + variation), Alarm: '0', Door: '0' } // Moving up
        ],
        "Belly 3": [
          { ID: 'P6', Fl: '12', Alarm: '0', Door: '1' } // Door open = stationary
        ],
        "Belly 4": [
          { ID: 'P1', Fl: String(8 - variation), Alarm: '0', Door: '0' }, // Moving down
          { ID: 'P2', Fl: '15', Alarm: '1', Door: '1' }, // Alarm = in service, no movement
          { ID: 'P3', Fl: String(3 + variation), Alarm: '0', Door: '0' } // Moving up
        ]
      });
    }, 0);
  });
};