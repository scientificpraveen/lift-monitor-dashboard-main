import React from "react";
import { buildings } from "../config/buildings";
import { useAuth } from "../context/AuthContext";
import "./Sidebar.css";

const Sidebar = ({
  selected,
  onSelect,
  onServiceLogClick,
  onPanelLogClick,
  onFireLogClick,
  onStpClick,
  onParkingClick,
  onUserManagementClick,
  onGuardTouringClick,
  activePanel,
}) => {
  const { getAccessibleBuildings, isAdmin } = useAuth();
  const accessibleBuildings = getAccessibleBuildings(buildings);

  return (
    <div className="sidebar">
      <h2 className="sidebar-title">🏢 Buildings</h2>

      <div className="building-list-container">
        <ul className="building-list">
          {accessibleBuildings.map((building) => (
            <React.Fragment key={building}>
              <li
                className={`building-item ${selected === building ? "active" : ""}`}
                onClick={() => onSelect(building)}
              >
                {building}
              </li>
              {selected === building && (
                <div className="submenu" style={{ paddingLeft: "15px" }}>
                  <li
                    className={`building-item ${selected === building && !activePanel ? "active" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(building);
                    }}
                    style={{ fontSize: "0.9em", borderLeft: "2px solid #ccc" }}
                  >
                    📊 LIFT STATUS
                  </li>
                  <li
                    className={`building-item ${activePanel === "service" ? "active" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(building);
                      onServiceLogClick();
                    }}
                    style={{ fontSize: "0.9em", borderLeft: "2px solid #ccc" }}
                  >
                    📋 OPERATOR LOG PANEL
                  </li>
                  <li
                    className={`building-item ${activePanel === "panel" ? "active" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(building);
                      onPanelLogClick();
                    }}
                    style={{ fontSize: "0.9em", borderLeft: "2px solid #ccc" }}
                  >
                    ⚡ HT/LT PANEL LOGS
                  </li>
                  <li
                    className={`building-item ${activePanel === "fire" ? "active" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(building);
                      onFireLogClick();
                    }}
                    style={{ fontSize: "0.9em", borderLeft: "2px solid #ccc" }}
                  >
                    🔥 FIRE LOG PANEL
                  </li>
                  <li
                    className={`building-item ${activePanel === "guard" ? "active" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(building);
                      onGuardTouringClick();
                    }}
                    style={{ fontSize: "0.9em", borderLeft: "2px solid #ccc" }}
                  >
                    🛡️ GUARD TOURING SYSTEM
                  </li>
                  {building === "PRESTIGE POLYGON" && (
                    <>
                      <li
                        className={`building-item ${activePanel === "stp" ? "active" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(building);
                          onStpClick();
                        }}
                        style={{ fontSize: "0.9em", borderLeft: "2px solid #ccc" }}
                      >
                        ⚙️ STP AUTOMATION
                      </li>
                      <li
                        className={`building-item ${activePanel === "parking" ? "active" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(building);
                          onParkingClick();
                        }}
                        style={{ fontSize: "0.9em", borderLeft: "2px solid #ccc" }}
                      >
                        🚗 PARKING SLOT VACANCY
                      </li>
                    </>
                  )}
                </div>
              )}
            </React.Fragment>
          ))}
          {isAdmin() && (
            <li
              className={`service-log-item admin-item ${activePanel === "users" ? "active" : ""}`}
              onClick={onUserManagementClick}
            >
              👥 USER MANAGEMENT
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
