import React from 'react';
import { buildings } from '../config/buildings';
import './Sidebar.css';

const Sidebar = ({ selected, onSelect }) => {
  return (
    <div className="sidebar">
      <h2 className="sidebar-title">🏢 Buildings</h2>

      <div className="building-list-container">
        <ul className="building-list">
          {buildings.map((building) => (
            <li
              key={building}
              className={`building-item ${selected === building ? 'active' : ''}`}
              onClick={() => onSelect(building)}
            >
              {building}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
