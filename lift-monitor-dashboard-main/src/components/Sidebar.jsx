import React from "react";
import { buildings } from "../config/buildings";
import { useAuth } from "../context/AuthContext";
import "./Sidebar.css";

const Sidebar = ({
  selected,
  onSelect,
  onServiceLogClick,
  onPanelLogClick,
  onStpClick,
  onUserManagementClick,
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
            <li
              key={building}
              className={`building-item ${selected === building && !activePanel ? "active" : ""
                }`}
              onClick={() => onSelect(building)}
            >
              {building}
            </li>
          ))}
          <li
            className={`service-log-item ${activePanel === "service" ? "active" : ""
              }`}
            onClick={onServiceLogClick}
          >
            OPERATOR LOG PANEL
          </li>
          <li
            className={`service-log-item ${activePanel === "panel" ? "active" : ""
              }`}
            onClick={onPanelLogClick}
          >
            ⚡ HT/LT PANEL LOGS
          </li>
          <li
            className={`service-log-item ${activePanel === "stp" ? "active" : ""
              }`}
            onClick={onStpClick}
          >
            ⚙️ STP AUTOMATION
          </li>
          {isAdmin() && (
            <li
              className={`service-log-item admin-item ${activePanel === "users" ? "active" : ""
                }`}
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
