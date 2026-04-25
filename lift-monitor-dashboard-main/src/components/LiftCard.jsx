import React from 'react';
import './LiftCard.css';
import { FaArrowUp, FaArrowDown, FaMinus } from 'react-icons/fa';

const LiftCard = ({ lift }) => {
  const { ID, Fl, Alarm, Door, direction, isOffline } = lift;
  const isDoorOpen = Door === '1';
  const isAlarm = Alarm === '1';

  console.log(`Lift ${ID}: Floor=${Fl}, Door=${Door}, Direction=${direction}`);

  const renderDirectionIcon = () => {
    switch (direction) {
      case 'up':
        return <FaArrowUp />;
      case 'down':
        return <FaArrowDown />;
      case 'stationary':
      default:
        return <FaMinus />;
    }
  };

  return (
    <div className={`lift-card ${isAlarm ? 'alert' : ''}`}>
      <div className="arrow" style={{ color: isOffline ? '#f97316' : undefined }}>
        {renderDirectionIcon()}
      </div>

      <div key={`door-${isDoorOpen}`} className={`circle ${isDoorOpen ? 'open' : ''} ${isOffline ? 'offline' : ''}`} style={isOffline ? { color: '#f97316' } : {}}>
        <span className="floor-number" style={{ color: isOffline ? '#f97316' : undefined }}>{Fl}</span>
      </div>

      <div className="lift-id">{ID}</div>
    </div>
  );
};

export default LiftCard;
