import React from "react";
import { buildings } from "../config/buildings";
import "./Sidebar.css";

const Sidebar = ({
  selected,
  onSelect,
  onServiceLogClick,
  onPanelLogClick,
  activePanel,
}) => {
  return (
    <div className="sidebar">
      <h2 className="sidebar-title">🏢 Buildings</h2>

      <div className="building-list-container">
        <ul className="building-list">
          {buildings.map((building) => (
            <li
              key={building}
              className={`building-item ${
                selected === building && !activePanel ? "active" : ""
              }`}
              onClick={() => onSelect(building)}
            >
              {building}
            </li>
          ))}
          <li
            className={`service-log-item ${
              activePanel === "service" ? "active" : ""
            }`}
            onClick={onServiceLogClick}
          >
            OPERATOR LOG PANEL
          </li>
          <li
            className={`service-log-item ${
              activePanel === "panel" ? "active" : ""
            }`}
            onClick={onPanelLogClick}
          >
            ⚡ HT/LT PANEL LOGS
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
