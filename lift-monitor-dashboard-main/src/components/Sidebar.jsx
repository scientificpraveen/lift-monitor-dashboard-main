import React from "react";
import { buildings } from "../config/buildings";
import "./Sidebar.css";

const Sidebar = ({ selected, onSelect, onServiceLogClick }) => {
  return (
    <div className="sidebar">
      <h2 className="sidebar-title">🏢 Buildings</h2>

      <div className="building-list-container">
        <ul className="building-list">
          {buildings.map((building) => (
            <li
              key={building}
              className={`building-item ${
                selected === building ? "active" : ""
              }`}
              onClick={() => onSelect(building)}
            >
              {building}
            </li>
          ))}
          <li className="service-log-item" onClick={onServiceLogClick}>
            OPERATOR LOG PANEL
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
