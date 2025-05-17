/* eslint-disable no-unused-expressions */
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './style/BatchMap.css';
import { BASE_API_URL } from '../../../../config';

const createCustomIcon = (color = 'blue') => {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

const BatchMapPopup = ({
  isOpen,
  onRequestClose,
  plaintes,
  onAssignSTT,
  onDeselect,
  Gouv,
  isselectedGouv,
  createdDeleg,
  onLinkSTT,
  successMessage,
  errorMessage,
  setSuccessMessage,
  setErrorMessage


}) => {
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSTTs, setFilteredSTTs] = useState([]);
  const [allSTTs, setAllSTTs] = useState([]);
  const [sttProgressCounts, setSttProgressCounts] = useState({});
  const [loadingCounts, setLoadingCounts] = useState(false);
  const [selectedSTT, setSelectedSTT] = useState(null);
  const [showFilteredSTTs, setShowFilteredSTTs] = useState(true);

  const toggleSTTViewMode = () => {
    setShowFilteredSTTs(!showFilteredSTTs);
    setSelectedSTT(null);
  };
  
  useEffect(() => {
    if (isOpen && plaintes.length > 0) {
      fetchCommonSTTs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, plaintes]);


  const loadSttProgressCounts = async (stts) => {
    setLoadingCounts(true);
    const counts = {};
    try {
      await Promise.all(stts.map(async (stt) => {
        try {
          const sttId = stt.id;
          const response = await fetch(`${BASE_API_URL}/plainte/stt/${sttId}/in-progress-count/${Gouv}`
          );
  
          if (response.ok) {
            const data = await response.json();
            counts[stt.id] = data.count || data;
          }
        } catch (error) {
          console.error('Error loading STT progress count:', error);
        }
      }));
  
      setSttProgressCounts(counts);
    } catch (error) {
      console.error('Error loading progress counts:', error);
    } finally {
      setLoadingCounts(false);
    }
  };
  const loadSttProgressCountsByDelegation = async (stts) => {
    setLoadingCounts(true);
    const counts = {};
    try {
      await Promise.all(stts.map(async (stt) => {
        try {
          const sttId = stt.id;
          const response = await fetch(
            `${BASE_API_URL}/plainte/stt/${sttId}/in-progress-count/${Gouv}/${createdDeleg}`
          );
  
          if (response.ok) {
            const data = await response.json();
            counts[stt.id] = data.count || data;
          }
        } catch (error) {
          console.error('Error loading STT progress count by delegation:', error);
        }
      }));
  
      setSttProgressCounts(counts);
    } catch (error) {
      console.error('Error loading progress counts by delegation:', error);
    } finally {
      setLoadingCounts(false);
    }
  };
  const handleAssignClick = async () => {
    if (!selectedSTT) {
      setErrorMessage("Veuillez sélectionner un STT");
      return;
    }
  
    try {
      await onAssignSTT(selectedSTT);
      setSuccessMessage("Affectation faite avec succès ✅");
    
      setTimeout(() => {
        setSuccessMessage(null);
      }, 4000);
  
      } catch (error) {
      setErrorMessage(error.message);

      setTimeout(() => {
        setSuccessMessage(null);
      }, 4000);
  
    }
  };

  const fetchCommonSTTs = async () => {
    try {
      const response = await fetch(`${BASE_API_URL}/companies/unblocked`);
      if (!response.ok) throw new Error('Erreur lors de la récupération des STT');
  
      const sttList = await response.json();
      
      // Préparer les STT filtrés (correspondants aux gouvernorats/délégations sélectionnés)
      const selectedGovernorates = [...new Set(plaintes.map(a => a.Gouvernorat))];
      const selectedDelegations = [...new Set(plaintes.map(a => a.Delegation))];
  
      const filteredSTTs = sttList
        .filter(stt => {
          const hasMatchingDelegation = stt.companyDelegations?.some(cd => {
            const govMatch = selectedGovernorates.includes(cd.delegation?.gouver?.name);
            const delMatch = selectedDelegations.includes(cd.delegation?.name);
            return govMatch && delMatch;
          });
          
          const isPrincipalSTT = selectedGovernorates.includes(stt.governorate) && 
            (!stt.delegation || stt.delegation.length === 0);
          
          return hasMatchingDelegation || isPrincipalSTT;
        })
        .map(stt => ({
          ...stt,
          type: stt.delegation && stt.delegation.length > 0 ? 'STT délégué' : 'STT principal',
          technicianCount: stt.users?.length || 0,
          matchingDelegations: [
            ...new Set(
              stt.companyDelegations
                ?.filter(cd => selectedDelegations.includes(cd.delegation?.name))
                .map(cd => cd.delegation?.name)
                .filter(Boolean) || []
            )
          ]
        }));
  
      // Préparer tous les STT (sans filtre)
      const allSTTsFormatted = sttList.map(stt => ({
        ...stt,
        type: stt.delegation && stt.delegation.length > 0 ? 'STT délégué' : 'STT principal',
        technicianCount: stt.users?.length || 0,
        matchingDelegations: []
      }));
  
      setAllSTTs(allSTTsFormatted);
      setFilteredSTTs(filteredSTTs);
      setSelectedSTT(null);
  
      // Charger les comptes de progression pour les STT filtrés
      if (createdDeleg && createdDeleg.trim() !== '') {
        await loadSttProgressCountsByDelegation(filteredSTTs);
      } else {
        await loadSttProgressCounts(filteredSTTs);
      }
    } catch (error) {
      console.error('Erreur lors de la recherche des STT:', error);
      setAllSTTs([]);
      setFilteredSTTs([]);
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
  
    const sourceList = showFilteredSTTs ? filteredSTTs : allSTTs;
    
    const filtered = sourceList.filter(stt => {
      const delegationMatch = stt.delegation 
        ? stt.delegation.toLowerCase().includes(term)
        : false;
      
      const nameMatch = stt.name 
        ? stt.name.toLowerCase().includes(term)
        : false;
  
      return delegationMatch || nameMatch;
    });
  
    setFilteredSTTs(filtered);
    setSelectedSTT(null);
  };
  if (!isOpen || plaintes.length === 0) return null;

  const center = {
    lat: plaintes.reduce((sum, a) => sum + parseFloat(a.LATITUDE_SITE), 0) / plaintes.length,
    lng: plaintes.reduce((sum, a) => sum + parseFloat(a.LONGITUDE_SITE), 0) / plaintes.length
  };

  return (
    <div className="modal-overlay">
      {successMessage && (
        <div className="success-popup">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="error-popup">
          {errorMessage}
          <button className="close-error-btn" onClick={() => setErrorMessage(null)}>X</button>
        </div>
      )}
      <div className="map-popup-container">
        <div className="map-popup-header">
          <div className="header-title">
            {isselectedGouv !== true ? (
              <h2>Affectation  </h2>
            ) : (
              <>
                <h2>Affectation </h2>
                <div className="selection-count">
                  {plaintes.length} plainte(s) sélectionnée(s)
                </div>
              </>
            )}
          </div>
          <button className="closeBatchMapAct-btn" onClick={onRequestClose}>
            x
          </button>
        </div>

        <div className="map-content">
          <div className="map-wrapper">
            <MapContainer
              center={center}
              zoom={10}
              style={{ height: '100%', width: '100%' }}
              onClick={() => setSelectedMarker(null)}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />

              {plaintes.map((plainte) => (
                <Marker
                  key={plainte.crm_case}
                  position={[
                    parseFloat(plainte.LATITUDE_SITE),
                    parseFloat(plainte.LONGITUDE_SITE)
                  ]}
                  icon={createCustomIcon('red')}
                  eventHandlers={{
                    click: (e) => {
                      e.originalEvent.stopPropagation();
                      setSelectedMarker(plainte.crm_case);
                    }
                  }}
                >
                  {selectedMarker === plainte.crm_case && (
                    <Popup
                      onClose={() => setSelectedMarker(null)}
                      className="custom-popup"
                    >
                      <div className="popup-content_deselect">
                        <h3>{plainte.crm_case}</h3>
                        <div className="popup-details">
                          <p><strong>Client:</strong> {plainte.CLIENT}</p>
                          <p><strong>Gouvernorat:</strong> {plainte.Gouvernorat}</p>
                        </div>
                        <button
                          className="deselect-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeselect(plainte);
                            setSelectedMarker(null);
                          }}
                        >
                          Désélectionner
                        </button>
                      </div>
                    </Popup>
                  )}
                </Marker>
              ))}
            </MapContainer>
          </div>

          <div className="stt-section">
          <div className="stt-header">
  <div className="stt-view-toggle">
  </div>
  </div>

  <button 
  onClick={toggleSTTViewMode} 
  className={`toggle-stt-mode-btn ${!showFilteredSTTs ? 'active' : ''}`}
  title={showFilteredSTTs ? "Voir tous les STT" : "Voir seulement les STT correspondants"}
>
  {showFilteredSTTs ? "STT correspondants" : "Tous les STT"}
</button>

<div className="stt-list-container">
  {loadingCounts ? (
    <div className="loading-message">Chargement des données...</div>
  ) : (showFilteredSTTs ? filteredSTTs : allSTTs).length > 0 ? (
    <div className="stt-select-wrapper">
      <select
        className="stt-dropdown"
        onChange={(e) => {
          const sttId = e.target.value;
          const chosenSTT = (showFilteredSTTs ? filteredSTTs : allSTTs).find(stt => stt.id.toString() === sttId);
          setSelectedSTT(chosenSTT || null);
        }}
      >
        <option value="">Sélectionner un STT</option>
        {(showFilteredSTTs ? filteredSTTs : allSTTs).map((stt) => (
          <option key={stt.id} value={stt.id}>
            {stt.name} 
            {stt.matchingDelegations?.length > 0 && ``}
            {' - '}
            {stt.technicianCount} tech(s)
            {' - '}
            {showFilteredSTTs && sttProgressCounts[stt.id] !== undefined 
              ? `${sttProgressCounts[stt.id]} en cours` 
              : " "}
          </option>
        ))}
      </select>

      {selectedSTT && (
        <div className="stt-info">
          <h4>
            <span className={`stt-type-badge ${selectedSTT.type === 'STT délégué' ? 'branch' : 'principal'}`}>
              {selectedSTT.type}
            </span>
            {selectedSTT.name}
          </h4>
          <div className="stt-meta">
            <span className="stt-governorate">
              {selectedSTT.governorate}
              {selectedSTT.delegation && ` - ${selectedSTT.delegation}`}
            </span>
            <span className="stt-tech-count">
              {selectedSTT.technicianCount} technicien(s)
            </span>
            {showFilteredSTTs && (
              <span className="stt-progress-count">
                {sttProgressCounts[selectedSTT.id] !== undefined 
                  ? `${sttProgressCounts[selectedSTT.id]} en cours` 
                  : "Chargement..."}
                {createdDeleg && createdDeleg.trim() !== '' ?
                  ` (dans ${createdDeleg})` :
                  ` (dans ${selectedSTT.name})`}
              </span>
            )}
          </div>
        </div>
      )}
      <button
        className="assign-btn"
        onClick={handleAssignClick}
        disabled={!selectedSTT}
      >
        Affecter
      </button>
    </div>
  ) : (
    <div className="no-stt">
      {searchTerm
        ? "Aucun STT trouvé pour cette recherche"
        : "Aucun STT disponible"}
    </div>
  )}
</div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchMapPopup;