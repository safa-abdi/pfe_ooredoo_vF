import React from 'react';
import './StockFilters.css';

const StockFilters = ({
  allcompanies,
  filterEmetteur,
  setFilterEmetteur,
  filterRecepteur,
  setFilterRecepteur,
  filterDate,
  setFilterDate,
  filterState,
  setFilterState,
  filterMvtType,
  setFilterMvtType
}) => {
  const resetFilters = () => {
    setFilterEmetteur('');
    setFilterRecepteur('');
    setFilterDate('');
    setFilterState('');
    setFilterMvtType('');
  };

  return (
    <div className="filters-container">
      <div className="filter-row">
        <div className="filter-group">
          <label>Émetteur</label>
          <select 
            onChange={(e) => setFilterEmetteur(e.target.value)} 
            value={filterEmetteur}
          >
            <option value="">Tous</option>
            {allcompanies.map(company => (
              <option key={company.id} value={company.name}>
                {company.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>STT</label>
          <select 
            onChange={(e) => setFilterRecepteur(e.target.value)} 
            value={filterRecepteur}
          >
            <option value="">Tous</option>
            {allcompanies.map(company => (
              <option key={company.id} value={company.name}>
                {company.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Status</label>
          <select 
            onChange={(e) => setFilterState(e.target.value)} 
            value={filterState}
          >
            <option value="">Tous</option>
            <option value="0">En attente</option>
            <option value="1">En RDV</option>
            <option value="2">Terminé</option>
            <option value="3">Annulé</option>
            <option value="4">Partiellement_terminé</option>

          </select>
        </div>
      </div>

      <div className="filter-row">
        <div className="filter-group">
          <label>Type Mouvement</label>
          <select
            onChange={(e) => setFilterMvtType(e.target.value)}
            value={filterMvtType}
          >
            <option value="">Tous</option>
            <option value="transfert">Transfert</option>
            <option value="DPM">DPM</option>
            <option value="retour">Retour</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Date Mouvement</label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>

        <div className="">
          <button className="reset-btn" onClick={resetFilters}>
            Réinitialiser
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockFilters;