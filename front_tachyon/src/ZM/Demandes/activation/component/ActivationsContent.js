import React, { useState , useEffect} from 'react';
import SearchBar from './SearchBar';
import Pagination from './Pagination';
import ActivationList from './ActivationList';
import { BASE_API_URL } from '../../../../config';

const ActivationsContent = ({
  activations,
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
  onActivationClick,
  setSelectedActivations,
onExportRequest
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGouv, setSelectedGouv] = useState(false);
  const [isselectedGouv, setIsSelectedGouv] = useState(false);
  const [createdDeleg, setcreatedDeleg] = useState("");
  const handleFilterChangeWrapper = (key, value) => {
    setSelectedActivations([]);
    onFilterChange(key, value);
  };


  const toggleFilters = () => {
    setShowFilters((prev) => !prev);
  };
  

  const filteredActivations = activations.filter(
    (activation) =>
      (activation.CLIENT?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (activation.MSISDN || '').includes(searchTerm) ||
      (activation.crm_case?.toString() || '').includes(searchTerm) ||
      (activation.CONTACT_CLIENT?.toString() || '').includes(searchTerm) ||
      (activation.Gouvernorat?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (activation.Delegation?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (activation.offre?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (activation.NAME_STT?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );
useEffect(() => {
  if (filters.gouvernorat) {
    setIsSelectedGouv(true);
    setSelectedGouv(filters.gouvernorat);
  } else {
    setIsSelectedGouv(false);
  }
  setcreatedDeleg(filters.delegation);
  
  setSelectedActivations([]);
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [filters.gouvernorat, filters.delegation]);

  return (
    <div className="main-content_act">
      <h1>Liste des Activations</h1>
      <div className="search-filter_act">
        <SearchBar onChange={onSearchChange} onSearch={onSearch} />
      </div>
      <button className="toggle-filters-btn" onClick={toggleFilters}>
        {showFilters ? 'Masquer filtres avancés' : 'Afficher filtres avancés'}
      </button>
      {showFilters && (
       <div className={`advancedAct-filters ${showFilters ? 'show' : ''}`}>
       <div className="filtersAct-container">
         <div className="filterAct-group">
           <h3>Etat de l'activation</h3>
            <div className="filter">
             <label>Statut</label>
             <select
               value={filters.STATUT}
               onChange={(e) => onFilterChange('STATUT', e.target.value)}
             >
               <option value="">Tous</option>
               <option value="Terminé">Terminé</option>
               <option value="Abandonné">Abandonné</option>
               <option value="En cours">En cours</option>
               <option value="Gelé">Gelé</option>
             </select>
           </div>
           <div className="filter">
             <label>Réponse travaux</label>
             <select
        value={filters.REP_TRAVAUX_STT}
        onChange={(e) => handleFilterChangeWrapper('REP_TRAVAUX_STT', e.target.value)}
      >

               <option value="">Tous</option>
               <option value="non_affecté_stt">Non affecté au STT</option>
               <option value="en_cours">En travaux</option>
               <option value="Effectué">Effectuée</option>
               <option value="Installé par le client">Installé par le client</option>
               <option value="Client ingoinable">Client ingoinable</option>
             </select>
           </div>
         </div>
         {/* Section Localisation */}
         <div className="filterAct-group">
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
         <div className="filterAct-group">
           <h3>Dates </h3>
           <div className="filter">
             <label>Date d'affectation STT</label>
             <input
               type="date"
               value={filters.DATE_AFFECTATION_STT}
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
           
         </div>
         
       </div>
       
     </div>
      )}

      <ActivationList activations={filteredActivations}  Gouv={selectedGouv} isselectedGouv={isselectedGouv} 
      createdDeleg={createdDeleg} onActivationClick={onActivationClick} 
      setSelectedActivations={setSelectedActivations} onExportRequest={onExportRequest}

      />
      <Pagination page={page} total={total} limit={limit} onPageChange={onPageChange} />
    </div>
  );
};

export default ActivationsContent;
