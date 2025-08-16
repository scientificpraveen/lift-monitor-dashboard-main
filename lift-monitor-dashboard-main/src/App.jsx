import React, { useEffect, useState, useRef } from 'react';
import Sidebar from './components/Sidebar';
import LiftCard from './components/LiftCard';
import Header from './components/Header';
import { buildings } from './config/buildings';
import { fetchLiftData } from './services/api';
import './App.css';
import './components/TopAlert.css';
import TopAlert from './components/TopAlert';


const App = () => {
  const [selectedBuilding, setSelectedBuilding] = useState(buildings[0]); // Default to first building
  const [liftData, setLiftData] = useState([]);
  const previousFloorsRef = useRef({}); // Use ref instead of state
  const liftHistoryRef = useRef({}); // Track floor history for direction logic
  const STATIONARY_THRESHOLD = 7; // Number of consecutive same floor readings before showing stationary
  const [alerts, setAlerts] = useState([]);
  const handleCloseAlert = (index) => {
    setAlerts(prev => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    // Fetch data immediately on mount
    const fetchData = async () => {
      const data = await fetchLiftData();
      const previousFloors = previousFloorsRef.current;
      
      console.log('Previous floors:', previousFloors);
      
      // Flatten the data and calculate direction
      const flattenedData = Object.entries(data).flatMap(([building, lifts]) =>
        lifts.map(lift => {
          const currentFloor = parseInt(lift.Fl);
          const liftKey = `${building}-${lift.ID}`;
          const prevFloor = previousFloorsRef.current[liftKey];
          
          // Initialize history if not exists
          if (!liftHistoryRef.current[liftKey]) {
            liftHistoryRef.current[liftKey] = {
              floorHistory: [],
              lastDirection: 'stationary'
            };
          }
          
          const liftHistory = liftHistoryRef.current[liftKey];
          
          console.log(`${liftKey}: current=${currentFloor}, prev=${prevFloor}`);
          
          let direction = 'stationary'; // default
          
          if (lift.Alarm === '1') {
            direction = 'stationary'; // alarm = in service, no movement
            console.log(`${liftKey}: In service (Alarm), direction = stationary`);
            // Reset history when in alarm
            liftHistory.floorHistory = [currentFloor];
            liftHistory.lastDirection = 'stationary';
          } else if (lift.Door === '1') {
            direction = 'stationary'; // door open = stationary
            console.log(`${liftKey}: Door open, direction = stationary`);
            // Keep current direction when door is open, don't change history
            direction = liftHistory.lastDirection === 'stationary' ? 'stationary' : liftHistory.lastDirection;
          } else if (prevFloor !== undefined && prevFloor !== currentFloor) {
            // Floor changed - determine direction
            direction = currentFloor > prevFloor ? 'up' : 'down';
            console.log(`${liftKey}: Moving ${direction} (${prevFloor} -> ${currentFloor})`);
            
            // Reset floor history and update direction
            liftHistory.floorHistory = [currentFloor];
            liftHistory.lastDirection = direction;
          } else if (prevFloor !== undefined && prevFloor === currentFloor) {
            // Floor didn't change - check history
            liftHistory.floorHistory.push(currentFloor);
            
            // Keep only recent history (last STATIONARY_THRESHOLD readings)
            if (liftHistory.floorHistory.length > STATIONARY_THRESHOLD) {
              liftHistory.floorHistory = liftHistory.floorHistory.slice(-STATIONARY_THRESHOLD);
            }
            
            // Check if we have enough consecutive same floor readings
            const allSameFloor = liftHistory.floorHistory.length >= STATIONARY_THRESHOLD && 
                                 liftHistory.floorHistory.every(floor => floor === currentFloor);
            
            if (allSameFloor) {
              direction = 'stationary';
              liftHistory.lastDirection = 'stationary';
              console.log(`${liftKey}: Stationary confirmed after ${liftHistory.floorHistory.length} readings`);
            } else {
              // Keep previous direction until we have enough stationary readings
              direction = liftHistory.lastDirection;
              console.log(`${liftKey}: Maintaining ${direction} direction (${liftHistory.floorHistory.length}/${STATIONARY_THRESHOLD} stationary readings)`);
            }
          } else {
            // First load
            console.log(`${liftKey}: First load, direction = stationary`);
            liftHistory.floorHistory = [currentFloor];
            liftHistory.lastDirection = 'stationary';
          }
          
          return { ...lift, building, direction };
        })
      );
      
      // Update previous floors for next comparison
      const newPreviousFloors = {};
      flattenedData.forEach(lift => {
        const liftKey = `${lift.building}-${lift.ID}`;
        newPreviousFloors[liftKey] = parseInt(lift.Fl);
      });
      previousFloorsRef.current = newPreviousFloors;
      console.log('Updated previous floors:', newPreviousFloors);
      
      setLiftData(flattenedData);

      const newAlerts = flattenedData
        .filter((lift) => lift.Alarm === "1")
        .map((lift) => ({
          id: lift.ID,
          floor: lift.Fl,
          building: lift.building,
        }));

      setAlerts(prevAlerts => {
        // Avoid duplicate alerts already shown
        const existingKeys = new Set(prevAlerts.map(a => `${a.id}-${a.floor}-${a.building}`));
        const uniqueNewAlerts = newAlerts.filter(
          a => !existingKeys.has(`${a.id}-${a.floor}-${a.building}`)
        );
        return [...prevAlerts, ...uniqueNewAlerts];
      });
    };

    // Load data immediately
    fetchData();

    // Then set up interval for periodic updates
    const interval = setInterval(fetchData, 500);

    return () => clearInterval(interval);
  }, []);

  const visibleLifts = liftData.filter((lift) =>
    lift.building === selectedBuilding
  );

  return (
    <div className="app">
      <Header />
      <TopAlert alerts={alerts} onClose={handleCloseAlert} />
      <div className="dashboard">
        <Sidebar selected={selectedBuilding} onSelect={setSelectedBuilding} />
        <div className="main-content">
          {visibleLifts.map((lift) => (
            <LiftCard key={lift.ID} lift={lift} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;
