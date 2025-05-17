import React, { useState, useEffect } from 'react';
import SearchBar from '../../activation/component/SearchBar';
import Pagination from '../../activation/component/Pagination';
import './style/plainteList.css';
import PlainteList from './PlainteList';
const PlaintesContent = ({
  plaintes,
  searchTerm,
  filters,
  gouvernoratsTunisie,
  page,
  total,
  limit,
  onSearchChange,
  onSearch,
  onFilterChange,
  onPageChange,
  onPlainteClick,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGouv, setSelectedGouv] = useState(false);
  const [isselectedGouv, setIsSelectedGouv] = useState(false);
  const [createdDeleg, setCreatedDeleg] = useState("");

  const toggleFilters = () => {
    setShowFilters((prev) => !prev);
  };

const filteredPlaintes = plaintes.filter((plainte) => {
  const normalize = (str) => (str || '').toString().toLowerCase().trim();
  
  // Filtre de recherche texte
  const matchesSearch = [
    plainte.CLIENT,
    plainte.MSISDN,
    plainte.crm_case,
    plainte.CONTACT_CLIENT,
    plainte.CONTACT2_CLIENT,
    plainte.Gouvernorat,
    plainte.Delegation,
    plainte.NAME_STT,
    plainte.STATUT
  ].some(field => normalize(field).includes(normalize(searchTerm)));

  const matchesFilters = (
    (!filters.REP_TRAVAUX_STT || normalize(plainte.REP_TRAVAUX_STT) === normalize(filters.REP_TRAVAUX_STT)) &&
    (!filters.DES_PACK || normalize(plainte.DES_PACK).includes(normalize(filters.DES_PACK))) &&
    (!filters.offre || normalize(plainte.offre).includes(normalize(filters.offre))) &&
    (!filters.gouvernorat || normalize(plainte.Gouvernorat) === normalize(filters.gouvernorat)) &&
    (!filters.delegation || normalize(plainte.Delegation).includes(normalize(filters.delegation))) &&
    (!filters.DATE_AFFECTATION_STT || plainte.DATE_AFFECTATION_STT === filters.DATE_AFFECTATION_STT) &&
    (!filters.DATE_PRISE_RDV || plainte.DATE_PRISE_RDV === filters.DATE_PRISE_RDV) &&
    (!filters.STATUT || normalize(plainte.STATUT).includes(normalize(filters.STATUT)))  );

  return matchesSearch && matchesFilters;
});

  useEffect(() => {
    if (filters.gouvernorat) {
      setIsSelectedGouv(true);
      setSelectedGouv(filters.gouvernorat);
    } else {
      setIsSelectedGouv(false);
    }
    setCreatedDeleg(filters.delegation);
  }, [filters.gouvernorat, filters.delegation]);

  return (
    <div className="main-content_act">

      <div className="search-filter_act">
        <SearchBar onChange={onSearchChange} onSearch={onSearch} />
      </div>

      <button className="toggle-filters-btnPlainte" onClick={toggleFilters}>
        {showFilters ? 'Masquer filtres avancés' : 'Afficher filtres avancés'}
      </button>

      {showFilters && (
        <div className={`advanced-filters ${showFilters ? 'show' : ''}`}>
          <div className="filters-container">
            {/* Section Informations Client */}
            <div className="filter-group">
              <h3>Informations Client</h3>
              <div className="filter">
                <label>Réponse travaux</label>
                <select
                  value={filters.REP_TRAVAUX_STT}
                  onChange={(e) => onFilterChange('REP_TRAVAUX_STT', e.target.value)}
                >
                  <option value="">Tous</option>
                  <option value="non_affecté_stt">Non affecté</option>
                  <option value="en_cours">En cours</option>
                  <option value="Effectué">Effectuée</option>
                  <option value="Installé par le client">Installé par le client</option>
                  <option value="Client ingoinable">Client ingoinable</option>
                </select>
              </div>
              <div className="filter">
                <label>Pack</label>
                <input
                  type="text"
                  value={filters.DES_PACK}
                  onChange={(e) => onFilterChange('DES_PACK', e.target.value)}
                />
              </div>
              <div className="filter">
                <label>Offre</label>
                <input
                  type="text"
                  value={filters.offre}
                  onChange={(e) => onFilterChange('offre', e.target.value)}
                />
              </div>
            </div>

            {/* Section Localisation */}
            <div className="filter-group">
              <h3>Localisation</h3>
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

            {/* Section Dates et Statut */}
            <div className="filter-group">
              <h3>Dates et Statut</h3>
              <div className="filter">
                <label>Date d'affectation STT</label>
                <input
                  type="date"
                  value={filters.DATE_AFFECTATION_STT ? new Date(filters.DATE_AFFECTATION_STT).toISOString().split('T')[0] : ''}
                  onChange={(e) => onFilterChange('DATE_AFFECTATION_STT', e.target.value)}
                />
              </div>
              <div className="filter">
                <label>Date de prise de RDV</label>
                <input
                  type="date"
                  value={filters.DATE_PRISE_RDV}
                  onChange={(e) => onFilterChange('DATE_PRISE_RDV', e.target.value)}
                />
              </div>
              <div className="filter">
                <label>Statut</label>
                <select
                  value={filters.STATUT}
                  onChange={(e) => onFilterChange('STATUT', e.target.value)}
                >
                  <option value="">Tous</option>
                  <option value="Terminé">Terminé</option>
                  <option value="Abandonné">Abandonné</option>
                  <option value="Gelé">Gelé</option>
                  <option value="En cours">En cours</option>
                </select>
              </div>
            </div>
          </div>
        </div>

      )}
      <PlainteList
        plaintes={filteredPlaintes}
        Gouv={selectedGouv}
        isselectedGouv={isselectedGouv}
        createdDeleg={createdDeleg}
        onPlainteClick={onPlainteClick}
      />

      <Pagination page={page} total={total} limit={limit} onPageChange={onPageChange} />
    </div>
  );
};

export default PlaintesContent;