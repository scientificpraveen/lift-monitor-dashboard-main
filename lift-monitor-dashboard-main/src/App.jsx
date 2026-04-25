import React, { useEffect, useState, useRef } from "react";
import Sidebar from "./components/Sidebar";
import LiftCard from "./components/LiftCard";
import Header from "./components/Header";
import PanelLogManager from "./components/PanelLogManager";
import ServiceLogManager from "./components/ServiceLogManager";
import UserManagement from "./components/UserManagement";
import StpAutomation from "./components/StpAutomation";
import ParkingVacancy from "./components/ParkingVacancy";
import FireLogManager from "./components/FireLogManager";
import GuardTouringManager from "./components/GuardTouringManager";
import Auth from "./components/Auth";
import { buildings } from "./config/buildings";
import { fetchLiftData } from "./services/api";
import { useAuth } from "./context/AuthContext";
import { parseFloor } from "./utils/floorUtils";
import LiftPanelConfigModal from "./components/LiftPanelConfigModal";
import WhatsappConfigModal from "./components/WhatsappConfigModal";
import { FaCog, FaPhone } from "react-icons/fa";
import "./App.css";
import "./components/TopAlert.css";
import TopAlert from "./components/TopAlert";

const API_BASE_URL = import.meta.env.VITE_API_BASE || "http://localhost:3001/api";

const App = () => {
  const { isAuthenticated, loading, getAccessibleBuildings, user } = useAuth();
  const [activePanel, setActivePanel] = useState(null); // null, 'service', 'panel', 'stp', or 'users'
  const accessibleBuildings = getAccessibleBuildings(buildings);
  const [selectedBuilding, setSelectedBuilding] = useState(
    accessibleBuildings[0] || buildings[0]
  );
  const [liftData, setLiftData] = useState([]);
  const previousFloorsRef = useRef({});
  const liftHistoryRef = useRef({});
  const acknowledgedAlarmsRef = useRef(new Set());
  const STATIONARY_THRESHOLD = 7;
  const [alerts, setAlerts] = useState([]);
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);
  const [showLiftConfigModal, setShowLiftConfigModal] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState(Date.now());

  const handleCloseAlert = (index) => {
    setAlerts((prev) => {
      const target = prev[index];
      if (target) {
        acknowledgedAlarmsRef.current.add(`${target.id}-${target.building}`);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const adminButtonStyle = {
    background: 'linear-gradient(135deg, #a076f9 0%, #6b2eff 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    padding: '10px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  };

  // Reset building selection if new user logs in and previous building is restricted
  useEffect(() => {
    if (user) {
      const allowed = getAccessibleBuildings(buildings);
      if (allowed.length > 0 && !allowed.includes(selectedBuilding)) {
        setSelectedBuilding(allowed[0]);
        setActivePanel(null);
      }
    }
  }, [user]);

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

      const currentAlarms = flattenedData.filter(l => l.Alarm === "1");
      const currentAlarmKeys = new Set(currentAlarms.map(l => `${l.ID}-${l.building}`));

      for (const key of acknowledgedAlarmsRef.current) {
        if (!currentAlarmKeys.has(key)) {
          acknowledgedAlarmsRef.current.delete(key);
        }
      }

      setAlerts((prevAlerts) => {
        const validPrevAlerts = prevAlerts.filter(a => currentAlarmKeys.has(`${a.id}-${a.building}`));
        const existingKeys = new Set(validPrevAlerts.map(a => `${a.id}-${a.building}`));

        const novelAlerts = currentAlarms
          .filter(l => !existingKeys.has(`${l.ID}-${l.building}`) && !acknowledgedAlarmsRef.current.has(`${l.ID}-${l.building}`))
          .map(l => ({ id: l.ID, floor: l.Fl, building: l.building }));

        return [...validPrevAlerts, ...novelAlerts];
      });

      // Synchronize Whatsapp Edge Connection Status seamlessly
      try {
        const wsRes = await fetch(`${API_BASE_URL}/whatsapp-status`);
        if (wsRes.ok) {
          const wData = await wsRes.json();
          setWhatsappStatus(wData.lastHit);
        }
      } catch (e) { }
    };

    fetchData();

    const interval = setInterval(fetchData, 1000);

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

  const visibleAlerts = activePanel === null ? alerts.filter(
    (alert) => alert.building === selectedBuilding
  ) : [];

  return (
    <div className="app">
      <Header />

      <>
        <TopAlert alerts={visibleAlerts} onClose={handleCloseAlert} />
        <div className="dashboard">
          <Sidebar
            selected={selectedBuilding}
            onSelect={(building) => {
              setSelectedBuilding(building);
              setActivePanel(null);
            }}
            onServiceLogClick={() => setActivePanel("service")}
            onPanelLogClick={() => setActivePanel("panel")}
            onFireLogClick={() => setActivePanel("fire")}
            onStpClick={() => setActivePanel("stp")}
            onParkingClick={() => setActivePanel("parking")}
            onGuardTouringClick={() => setActivePanel("guard")}
            onUserManagementClick={() => setActivePanel("users")}
            activePanel={activePanel}
          />
          {activePanel === null ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", backgroundColor: "#f5f5f5", padding: "40px" }}>
              <div className="standard-header">
                <div>
                  <h2>LIFT STATUS</h2>
                  <span className="subtitle">
                    Building Name: <strong>{selectedBuilding}</strong> ({visibleLifts.length} CONFIGURED)
                  </span>
                </div>
                {user?.role === 'admin' && (
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', marginRight: '15px', gap: '8px',
                      backgroundColor: 'white',
                      border: '1px solid #cbd5e1',
                      borderRadius: '9999px',
                      padding: '6px 14px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}>
                      <div style={{
                        width: '10px', height: '10px', borderRadius: '50%',
                        backgroundColor: (Date.now() - whatsappStatus) < 30000 ? '#22c55e' : '#ef4444',
                        boxShadow: (Date.now() - whatsappStatus) < 30000 ? '0 0 10px #22c55e' : 'none',
                        animation: (Date.now() - whatsappStatus) < 30000 ? 'pulse 2s infinite' : 'none'
                      }}></div>
                      <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e3a8a', letterSpacing: '0.5px' }}>
                        {(Date.now() - whatsappStatus) < 30000 ? "ALARM NOTIFICATION ONLINE" : "ALARM NOTIFICATION OFFLINE"}
                      </span>
                    </div>
                    <button className="base-btn action-btn" style={adminButtonStyle} onClick={() => setShowLiftConfigModal(true)}>
                      <FaCog size={16} />
                      UPDATE LIFT PANEL
                    </button>
                    <button className="base-btn action-btn" style={adminButtonStyle} onClick={() => setShowWhatsappModal(true)}>
                      <FaPhone size={16} />
                      UPDATE MOBILE NUMBER
                    </button>
                  </div>
                )}
              </div>
              <div style={{
                backgroundColor: 'white',
                borderRadius: '15px',
                padding: '30px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                overflowY: 'auto',
                flex: 1
              }}>
                <div className="main-content" style={{ background: 'transparent', padding: '15px 10px' }}>
                  {visibleLifts.map((lift) => (
                    <LiftCard key={lift.ID} lift={lift} />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="panel-content">
              {activePanel === "service" && <ServiceLogManager building={selectedBuilding} />}
              {activePanel === "panel" && <PanelLogManager building={selectedBuilding} />}
              {activePanel === "fire" && <FireLogManager building={selectedBuilding} />}
              {activePanel === "stp" && <StpAutomation building={selectedBuilding} />}
              {activePanel === "parking" && <ParkingVacancy building={selectedBuilding} />}
              {activePanel === "guard" && <GuardTouringManager building={selectedBuilding} />}
              {activePanel === "users" && <UserManagement />}
            </div>
          )}
        </div>
        <LiftPanelConfigModal isOpen={showLiftConfigModal} onClose={() => setShowLiftConfigModal(false)} building={selectedBuilding} />
        <WhatsappConfigModal isOpen={showWhatsappModal} onClose={() => setShowWhatsappModal(false)} building={selectedBuilding} />
      </>
    </div>
  );
};

export default App;
