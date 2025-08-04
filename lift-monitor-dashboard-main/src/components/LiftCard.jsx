import React from 'react';
import './LiftCard.css';
import { FaArrowUp, FaArrowDown, FaMinus } from 'react-icons/fa';

const LiftCard = ({ lift }) => {
  const { ID, Fl, Alarm, Door, direction } = lift;
  const isDoorOpen = Door === '1';
  const isAlarm = Alarm === '1';

  // Debug: Log the direction value
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
      <div className="arrow">
        {renderDirectionIcon()}
      </div>

      {/* 🔄 force reanimation with a dynamic key */}
      <div key={`door-${isDoorOpen}`} className={`circle ${isDoorOpen ? 'open' : ''}`}>
        <span className="floor-number">{Fl}</span>
      </div>

      <div className="lift-id">Lift {ID}</div>
    </div>
  );
};

export default LiftCard;
