import React from 'react';

const DatePopup = ({ selectedDates, setShowPopup }) => {
  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <h3>Dates de prélèvement</h3>
        <ul>
          {selectedDates.map((date, index) => (
            <li key={index}>{date}</li>
          ))}
        </ul>
        <button 
          className="close-popup" 
          onClick={() => setShowPopup(false)}
        >
          Fermer
        </button>
      </div>
    </div>
  );
};

export default DatePopup;