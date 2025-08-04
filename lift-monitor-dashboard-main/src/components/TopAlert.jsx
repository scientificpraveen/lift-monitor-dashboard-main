// components/TopAlert.jsx
import React from "react";
import "./TopAlert.css";

const TopAlert = ({ alerts, onClose }) => {
  if (alerts.length === 0) return null;

  return (
    <div className="top-alert-container">
      {alerts.map((alert, index) => (
        <div className="alert-box" key={index}>
            <span>
            🚨 <strong>Alert in <b>{alert.building}</b> – Lift <b>{alert.id}</b> at Floor <b>{alert.floor}</b></strong>
            </span>
          <button className="close-btn" onClick={() => onClose(index)}>✕</button>
        </div>
      ))}
    </div>
  );
};

export default TopAlert;
