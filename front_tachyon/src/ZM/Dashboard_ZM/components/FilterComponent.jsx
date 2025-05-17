import React, { useState } from 'react';
import './FilterComponent.css';

const FilterComponent = ({
  filterType, setFilterType,
  selectedDate, setSelectedDate,
  startDate, setStartDate,
  endDate, setEndDate,
  errorMessage, setErrorMessage,
  dataType, setDataType
}) => {
  const [isVisible, setIsVisible] = useState(false); // Déjà initialisé à false

  const handleStartDateChange = (e) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);
    if (endDate && newStartDate > endDate) {
      setErrorMessage('La date de début ne peut pas être après la date de fin');
      return;
    }
    setErrorMessage('');
  };

  const handleEndDateChange = (e) => {
    const newEndDate = e.target.value;
    setEndDate(newEndDate);
    if (startDate && newEndDate < startDate) {
      setErrorMessage('La date de fin ne peut pas être avant la date de début');
      return;
    }
    
    // Validation de la période (max 1 mois)
    if (startDate) {
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(newEndDate);
      const diffInMonths = (endDateObj.getFullYear() - startDateObj.getFullYear()) * 12 + 
                          (endDateObj.getMonth() - startDateObj.getMonth());
      
      if (diffInMonths > 1) {
        setErrorMessage('La période sélectionnée ne doit pas dépasser un mois.');
        setStartDate('');
        setEndDate('');
        return;
      }
    }
    
    setErrorMessage('');
  };

  return (
    <div className="filter-container78">
      <button 
        className="filter-toggle-button"
        onClick={() => setIsVisible(!isVisible)}
        aria-expanded={isVisible}
      >
        {isVisible ? 'Masquer les filtres ▲' : 'Afficher les filtres ▼'}
      </button>

      {isVisible && (
        <div className="filter-content78">
          <div className="filter-row78">
            <div className="filter-group78">
              <label htmlFor="filterType">Filtrer par :</label>
              <select
                id="filterType"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="filter-select"
              >
                <option value="day">Jour</option>
                <option value="period">Période</option>
              </select>
            </div>

            {filterType === 'day' ? (
              <div className="filter-group78">
                <label htmlFor="datePicker">Date :</label>
                <input
                  type="date"
                  id="datePicker"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="filter-input"
                />
              </div>
            ) : (
              <>
                <div className="filter-group78">
                  <label htmlFor="startDate">Début :</label>
                  <input
                    type="date"
                    id="startDate"
                    value={startDate}
                    onChange={handleStartDateChange}
                    className="filter-input"
                  />
                </div>
                <div className="filter-group78">
                  <label htmlFor="endDate">Fin :</label>
                  <input
                    type="date"
                    id="endDate"
                    value={endDate}
                    onChange={handleEndDateChange}
                    className="filter-input"
                  />
                </div>
              </>
            )}

            <div className="filter-group78">
              <label htmlFor="dataType">Afficher :</label>
              <select
                id="dataType"
                value={dataType}
                onChange={(e) => setDataType(e.target.value)}
                className="filter-select"
              >
                <option value="both">Tous</option>
                <option value="activation">Activations</option>
                <option value="plainte">Plaintes</option>
                <option value="resiliation">Résiliations</option>
              </select>
            </div>
          </div>

          {errorMessage && (
            <p className="error-message">{errorMessage}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterComponent;