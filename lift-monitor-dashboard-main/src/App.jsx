import React, { useEffect, useState, useRef } from "react";
import Sidebar from "./components/Sidebar";
import LiftCard from "./components/LiftCard";
import Header from "./components/Header";
import PanelLogManager from "./components/PanelLogManager";
import ServiceLogManager from "./components/ServiceLogManager";
import UserManagement from "./components/UserManagement";
import StpAutomation from "./components/StpAutomation";
import Auth from "./components/Auth";
import { buildings } from "./config/buildings";
import { fetchLiftData } from "./services/api";
import { useAuth } from "./context/AuthContext";
import { parseFloor } from "./utils/floorUtils";
import "./App.css";
import "./components/TopAlert.css";
import TopAlert from "./components/TopAlert";

const App = () => {
  const { isAuthenticated, loading, getAccessibleBuildings } = useAuth();
  const [activePanel, setActivePanel] = useState(null); // null, 'service', 'panel', 'stp', or 'users'
  const accessibleBuildings = getAccessibleBuildings(buildings);
  const [selectedBuilding, setSelectedBuilding] = useState(
    accessibleBuildings[0] || buildings[0]
  );
  const [liftData, setLiftData] = useState([]);
  const previousFloorsRef = useRef({});
  const liftHistoryRef = useRef({});
  const STATIONARY_THRESHOLD = 7;
  const [alerts, setAlerts] = useState([]);

  const handleCloseAlert = (index) => {
    setAlerts((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchData = async () => {
      const data = await fetchLiftData();
      const previousFloors = previousFloorsRef.current;

      console.log("Previous floors:", previousFloors);

      const flattenedData = Object.entries(data).flatMap(([building, lifts]) =>
        lifts.map((lift) => {
          const currentFloor = parseFloor(lift.Fl);
          const liftKey = `${building}-${lift.ID}`;
          const prevFloor = previousFloorsRef.current[liftKey];

          if (!liftHistoryRef.current[liftKey]) {
            liftHistoryRef.current[liftKey] = {
              floorHistory: [],
              lastDirection: "stationary",
            };
          }

          const liftHistory = liftHistoryRef.current[liftKey];

          console.log(`${liftKey}: current=${currentFloor}, prev=${prevFloor}`);

          let direction = "stationary";

          if (lift.Alarm === "1") {
            direction = "stationary";
            console.log(
              `${liftKey}: In service (Alarm), direction = stationary`
            );
            liftHistory.floorHistory = [currentFloor];
            liftHistory.lastDirection = "stationary";
          } else if (lift.Door === "1") {
            direction = "stationary";
            console.log(`${liftKey}: Door open, direction = stationary`);
            liftHistory.lastDirection = "stationary";
          } else if (prevFloor !== undefined && prevFloor !== currentFloor) {
            direction = currentFloor > prevFloor ? "up" : "down";
            console.log(
              `${liftKey}: Moving ${direction} (${prevFloor} -> ${currentFloor})`
            );
            liftHistory.floorHistory = [currentFloor];
            liftHistory.lastDirection = direction;
          } else if (prevFloor !== undefined && prevFloor === currentFloor) {
            liftHistory.floorHistory.push(currentFloor);
            if (liftHistory.floorHistory.length > STATIONARY_THRESHOLD) {
              liftHistory.floorHistory = liftHistory.floorHistory.slice(
                -STATIONARY_THRESHOLD
              );
            }
            const allSameFloor =
              liftHistory.floorHistory.length >= STATIONARY_THRESHOLD &&
              liftHistory.floorHistory.every((floor) => floor === currentFloor);

            if (allSameFloor) {
              direction = "stationary";
              liftHistory.lastDirection = "stationary";
              console.log(
                `${liftKey}: Stationary confirmed after ${liftHistory.floorHistory.length} readings`
              );
            } else {
              direction = liftHistory.lastDirection;
              console.log(
                `${liftKey}: Maintaining ${direction} direction (${liftHistory.floorHistory.length}/${STATIONARY_THRESHOLD} stationary readings)`
              );
            }
          } else {
            console.log(`${liftKey}: First load, direction = stationary`);
            liftHistory.floorHistory = [currentFloor];
            liftHistory.lastDirection = "stationary";
          }

          return { ...lift, building, direction };
        })
      );

      const newPreviousFloors = {};
      flattenedData.forEach((lift) => {
        const liftKey = `${lift.building}-${lift.ID}`;
        newPreviousFloors[liftKey] = parseFloor(lift.Fl);
      });
      previousFloorsRef.current = newPreviousFloors;
      console.log("Updated previous floors:", newPreviousFloors);

      setLiftData(flattenedData);

      const newAlerts = flattenedData
        .filter((lift) => lift.Alarm === "1")
        .map((lift) => ({
          id: lift.ID,
          floor: lift.Fl,
          building: lift.building,
        }));

      setAlerts((prevAlerts) => {
        const existingKeys = new Set(
          prevAlerts.map((a) => `${a.id}-${a.floor}-${a.building}`)
        );
        const uniqueNewAlerts = newAlerts.filter(
          (a) => !existingKeys.has(`${a.id}-${a.floor}-${a.building}`)
        );
        return [...prevAlerts, ...uniqueNewAlerts];
      });
    };

    fetchData();

    const interval = setInterval(fetchData, 5000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Auth />;
  }

  const visibleLifts = liftData.filter(
    (lift) => lift.building === selectedBuilding
  );

  return (
    <div className="app">
      <Header />

      <>
        <TopAlert alerts={alerts} onClose={handleCloseAlert} />
        <div className="dashboard">
          <Sidebar
            selected={selectedBuilding}
            onSelect={(building) => {
              setSelectedBuilding(building);
              setActivePanel(null);
            }}
            onServiceLogClick={() => setActivePanel("service")}
            onPanelLogClick={() => setActivePanel("panel")}
            onStpClick={() => setActivePanel("stp")}
            onUserManagementClick={() => setActivePanel("users")}
            activePanel={activePanel}
          />
          {activePanel === null ? (
            <div className="main-content">
              {visibleLifts.map((lift) => (
                <LiftCard key={lift.ID} lift={lift} />
              ))}
            </div>
          ) : (
            <div className="panel-content">
              {activePanel === "service" && <ServiceLogManager />}
              {activePanel === "panel" && <PanelLogManager />}
              {activePanel === "stp" && <StpAutomation />}
              {activePanel === "users" && <UserManagement />}
            </div>
          )}
        </div>
      </>
    </div>
  );
};

export default App;
