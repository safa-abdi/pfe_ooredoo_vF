import React from 'react';

const Filters = ({ filters, gouvernoratsTunisie, onFilterChange, onApplyFilters }) => {
  return (
    <div className="filters-container">
      <div className="filter">
        <label>Réponse travaux</label>
        <select
          value={filters.REP_TRAVAUX_STT}
          onChange={(e) => onFilterChange('REP_TRAVAUX_STT', e.target.value)}
        >
          <option value="">Tous</option>
          <option value="en_cours">En cours</option>
          <option value="Effectué">Effectuée</option>
          <option value="Installé par le client">Installé par le client</option>
          <option value="Client ingoinable">Client ingoinable</option>
          <option value="non_affecté_stt">Pas encore affecté au STT</option>
        </select>
      </div>
      <div className="filter">
        <label>Gouvernorat</label>
        <select
          value={filters.gouvernorat}
          onChange={(e) => onFilterChange('gouvernorat', e.target.value)}
        >
          <option value="">Tous</option>
          {gouvernoratsTunisie.map((gouvernorat) => (
            <option key={gouvernorat} value={gouvernorat}>
              {gouvernorat}
            </option>
          ))}
        </select>
      </div>
      <div className="filter">
        <label>Délégation</label>
        <input
          type="text"
          value={filters.delegation}
          onChange={(e) => onFilterChange('delegation', e.target.value)}
        />
      </div>
    </div>
  );
};

export default Filters;