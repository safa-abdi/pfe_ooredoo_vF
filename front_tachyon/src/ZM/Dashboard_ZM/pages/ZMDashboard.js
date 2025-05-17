import React, { useState, useEffect, useCallback, useMemo } from 'react';
import MapComponent from '../components/MapComponent';
import FilterComponent from '../components/FilterComponent';
import STTStatisticsComponent from '../components/STTStatisticsComponent';
import NavbarHorizontal from '../../navbar/NavbarHorizontal';
import NavbarVertical from '../../navbar/NavbarVertical';
import GouvDashboardStats from '../components/GouvDashboardStats';
import './ZMDashboard.css';
import SearchBar2 from '../components/SearchBar2';
import { debounce } from 'lodash';
import { BASE_API_URL } from '../../../config';
import StatusCardsComponent from '../components/StatusCardsComponent';
const ZMDashboard = () => {
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const [clickedPosition, setClickedPosition] = useState(null);
  const [gouvernorat, setGouvernorat] = useState(null);
  const [activations, setActivations] = useState([]);
  const [plaintes, setPlaintes] = useState([]);
  const [resiliation, setResiliation] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [filterType, setFilterType] = useState('day');
  const [errorMessage, setErrorMessage] = useState('');
  const [dataType, setDataType] = useState('both');
  const [showFilter, setShowFilter] = useState(true);
  const [activeTab, setActiveTab] = useState('map');
  const [sttData, setSttData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientPopup, setShowClientPopup] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [activationCursor, setActivationCursor] = useState(null);
  const [hasMoreActivations, setHasMoreActivations] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [sttActivations, setSttActivations] = useState([]);
  const [sttPlaintes, setSttPlaintes] = useState([]);
  const [filteredByStatus, setFilteredByStatus] = useState(null);
  const [showStatusPopup, setShowStatusPopup] = useState(false);
  const [isLoadingStatusData, setIsLoadingStatusData] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [mapDisplayData, setMapDisplayData] = useState({
  activations: [],
  plaintes: [],
  resiliations: []
});
const cleanGouvernoratName = (name) => {
  if (!name) return '';
  return name
    .trim()
    .toLowerCase()
    .replace(/^gouvernorat\s+/i, '')
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};
const handleGouvernoratSelect = async (selectedGouvernorat) => {
  setGouvernorat(selectedGouvernorat);
  if (selectedGouvernorat && selectedGouvernorat !== "Non trouvé") {
    try {
      setIsLoadingStatusData(true);
        const cleanedGouvernorat = cleanGouvernoratName(selectedGouvernorat);
        setGouvernorat(cleanedGouvernorat);
      console.log("gouvernorat selectionnée",cleanedGouvernorat)
      const endpoints = ['frozen', 'non_affected', 'En_rdv', 'En_travaux'];
      const requests = [];
      endpoints.forEach(endpoint => {
        requests.push(
          fetch(`${BASE_API_URL}/activation/${endpoint}?gouvernorat=${encodeURIComponent(cleanedGouvernorat)}`)
            .then(res => res.json())
            .then(data => ({
              type: 'activations',
              endpoint,
              count: data.count,
              data: data.data || []
            }))
        );
        requests.push(
          fetch(`${BASE_API_URL}/plainte/${endpoint}?gouvernorat=${encodeURIComponent(cleanedGouvernorat)}`)
            .then(res => res.json())
            .then(data => ({
              type: 'plaintes',
              endpoint,
              count: data.count,
              data: data.data || []
            }))
        );
      });

      const results = await Promise.all(requests);
      const newCounts = { activations: {}, plaintes: {} };
      const fullData = { 
        activations: { frozen: [], non_affected: [], En_rdv: [], En_travaux: [] },
        plaintes: { frozen: [], non_affected: [], En_rdv: [], En_travaux: [] }
      };

      results.forEach(result => {
        newCounts[result.type][result.endpoint] = result.count;
        fullData[result.type][result.endpoint] = result.data;
      });

      setStatusCounts(newCounts);
      setStatusFullData(fullData);

      const filteredActivations = dataType !== 'plainte' 
        ? activations.filter(act => act.Gouvernorat === selectedGouvernorat)
        : [];
      const filteredPlaintes = dataType !== 'activation' 
        ? plaintes.filter(plainte => plainte.Gouvernorat === selectedGouvernorat)
        : [];

      setMapDisplayData({
        activations: filteredActivations,
        plaintes: filteredPlaintes,
        resiliations: []
      });

      console.log("Données filtrées par gouvernorat :", {
        gouvernorat: selectedGouvernorat,
        activations: filteredActivations,
        plaintes: filteredPlaintes
      });

    } catch (error) {
      console.error("Erreur lors de la récupération des données par gouvernorat:", error);
    } finally {
      setIsLoadingStatusData(false);
    }
  } else {
    showDefaultMapData();
  }
};

const showDefaultMapData = () => {
  setMapDisplayData({
    activations: dataType !== 'plainte' ? activations : [],
    plaintes: dataType !== 'activation' ? plaintes : [],
    resiliations: []
  });
};
const calculateStatusCounts = (activations, plaintes) => {
  const statusCounts = {
    activations: {},
    plaintes: {}
  };

  activations.forEach(act => {
    const status = act.STATUT || 'non_affected';
    statusCounts.activations[status] = (statusCounts.activations[status] || 0) + 1;
  });

  // Compte les statuts de plaintes
  plaintes.forEach(pl => {
    const status = pl.STATUT || 'non_affected';
    statusCounts.plaintes[status] = (statusCounts.plaintes[status] || 0) + 1;
  });

  return statusCounts;
};

useEffect(() => {
  if (activations.length > 0 || plaintes.length > 0) {
    showDefaultMapData();
  }
}, [activations, plaintes, dataType]);
  const [statusCounts, setStatusCounts] = useState({
    activations: {},
    plaintes: {}
  });
  const getCurrentItems = (data) => {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return data.slice(startIndex, endIndex);
};
  const safeDateParse = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  };
const closeStatusPopup = () => {
  setShowStatusPopup(false);
  setFilteredByStatus(null);
  setCurrentPage(1);
};

  const fetchPaginatedData = async (url, params, isPlainte = false) => {
    const queryUrl = new URL(url);
    Object.entries(params).forEach(([key, value]) => {
      if (value) queryUrl.searchParams.append(key, value);
    });

    const response = await fetch(queryUrl.toString());
    return response.json();
  };
const filterDataByStatus = (statusType, dataTypeToUse = dataType) => {
  setCurrentPage(1); 
  if (!statusFullData) {
    console.warn("Status full data not loaded yet");
    return;
  }

  const centerMapOnFirstItem = (dataArray) => {
    const first = dataArray[0];
    if (first?.LATITUDE_SITE && first?.LONGITUDE_SITE) {
      setClickedPosition({
        lat: parseFloat(first.LATITUDE_SITE),
        lng: parseFloat(first.LONGITUDE_SITE)
      });
    }
  };

  // Toujours utiliser le dataType passé en paramètre (ou le dataType courant par défaut)
  if (dataTypeToUse === 'both') {
    const activationData = statusFullData.activations?.[statusType] || [];
    const plainteData = statusFullData.plaintes?.[statusType] || [];
    
    setMapDisplayData({
      activations: activationData,
      plaintes: plainteData,
      resiliations: [] 
    });

    setFilteredByStatus({
      statusType,
      dataType: 'both',
      data: [...activationData, ...plainteData]
    });

    setShowStatusPopup(true);
    centerMapOnFirstItem([...activationData, ...plainteData]);
  } else if (dataTypeToUse === 'plainte') {
    const plainteData = statusFullData.plaintes?.[statusType] || [];
    setMapDisplayData({
      activations: [],
      plaintes: plainteData,
      resiliations: []
    });
    setFilteredByStatus({
      statusType,
      dataType: 'plainte',
      data: plainteData
    });
    setShowStatusPopup(true);
    centerMapOnFirstItem(plainteData);
  } else {
    // Activation
    const activationData = statusFullData.activations?.[statusType] || [];
    setMapDisplayData({
      activations: activationData,
      plaintes: [],
      resiliations: []
    });
    setFilteredByStatus({
      statusType,
      dataType: 'activation',
      data: activationData
    });
    setShowStatusPopup(true);
    centerMapOnFirstItem(activationData);
  }
};
  useEffect(() => {
    const fetchAllActivations = async () => {
      setIsLoading(true);
      try {
        let allActivations = [];
        let cursor = null;
        let hasMore = true;

        while (hasMore) {
          const params = {
            limit: 500,
            ...(cursor && { cursor })
          };

          const response = await fetchPaginatedData(
            `${BASE_API_URL}/activation/all_inprogress`,
            params
          );

          allActivations = [...allActivations, ...response.data];
          cursor = response.nextCursor;
          hasMore = !!cursor;
        }

        setActivations(allActivations);
      } catch (error) {
        console.error('Error fetching all activations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllActivations();
  }, []);

useEffect(() => {
  const fetchStatusCounts = async () => {
      setIsLoadingStatusData(true);
    try {
      const endpoints = ['frozen', 'non_affected', 'En_rdv', 'En_travaux'];
      const requests = [];
      
      endpoints.forEach(endpoint => {
        requests.push(
          fetch(`${BASE_API_URL}/plainte/${endpoint}`)
            .then(async res => {
              if (!res.ok) throw new Error(`Failed to fetch ${endpoint} plaintes`);
              const responseData = await res.json();
              return {
                type: 'plaintes',
                endpoint,
                count: responseData.count,
                fullData: responseData.data || []
              };
            })
            .catch(error => {
              console.error(`Error fetching ${endpoint} plaintes:`, error);
              return {
                type: 'plaintes',
                endpoint,
                count: 0,
                fullData: []
              };
            })
        );
      });

      endpoints.forEach(endpoint => {
        requests.push(
          fetch(`${BASE_API_URL}/activation/${endpoint}`)
            .then(async res => {
              if (!res.ok) throw new Error(`Failed to fetch ${endpoint} activations`);
              const responseData = await res.json();
              return {
                type: 'activations',
                endpoint,
                count: responseData.count,
                fullData: responseData.data || []
              };
            })
            .catch(error => {
              console.error(`Error fetching ${endpoint} activations:`, error);
              return {
                type: 'activations',
                endpoint,
                count: 0,
                fullData: []
              };
            })
        );
      });

      const results = await Promise.all(requests);
      const newCounts = { activations: {}, plaintes: {} };
      const fullData = { 
        activations: { frozen: [], non_affected: [], En_rdv: [], En_travaux: [] },
        plaintes: { frozen: [], non_affected: [], En_rdv: [], En_travaux: [] }
      };

      results.forEach(result => {
        newCounts[result.type][result.endpoint] = result.count;
        fullData[result.type][result.endpoint] = result.fullData;
      });

      setStatusCounts(newCounts);
      setStatusFullData(fullData);
    } catch (error) {
      console.error('Error fetching status counts:', error);
    }
  };

  fetchStatusCounts();
}, []);

const [statusFullData, setStatusFullData] = useState({
  activations: {
    frozen: { count: 0, data: [] },
    non_affected: { count: 0, data: [] },
    En_rdv: { count: 0, data: [] },
    En_travaux: { count: 0, data: [] }
  },
  plaintes: {
    frozen: { count: 0, data: [] },
    non_affected: { count: 0, data: [] },
    En_rdv: { count: 0, data: [] },
    En_travaux: { count: 0, data: [] }
  }
});
const [statusPagination, setStatusPagination] = useState({
  currentPage: 1,
  totalPages: 1,
  totalItems: 0
});


  useEffect(() => {
    const fetchSttData = async () => {
      try {
        const [activationsRes, plaintesRes] = await Promise.all([
          fetch(`${BASE_API_URL}/activation/in-progress-by-company`),
          fetch(`${BASE_API_URL}/plainte/in-progress-by-company`)
        ]);

        const activationsData = await activationsRes.json();
        const plaintesData = await plaintesRes.json();

        setSttActivations(activationsData);
        setSttPlaintes(plaintesData);
      } catch (error) {
        console.error('Error fetching STT data:', error);
      }
    };

    fetchSttData();
  }, [dataType, selectedDate, startDate, endDate]);
  useEffect(() => {
    const fetchAllPlaintes = async () => {
      setIsLoading(true);
      try {
        let allPlaintes = [];
        let cursor = null;
        let hasMore = true;


        while (hasMore) {
          const params = {
            limit: 50,
            ...(cursor && { cursor })
          };

          const response = await fetchPaginatedData(
            `${BASE_API_URL}/plainte/inProgress`,
            params
          );

          const data = response.data || response.results || [];
          allPlaintes = [...allPlaintes, ...data];
          cursor = response.next_cursor || response.meta?.next_cursor || null;
          hasMore = !!cursor;
        }

        setPlaintes(allPlaintes);
      } catch (error) {
        console.error("Erreur chargement plaintes:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllPlaintes();
  }, []);

  const loadMoreActivations = async () => {
    if (!activationCursor || isLoading) return;

    setIsLoading(true);
    try {
      const newData = await fetchPaginatedData(
        `${BASE_API_URL}/activation/all`,
        { cursor: activationCursor, limit: 100, STATUT: 'En cours' }
      );

      setActivations(prev => [...prev, ...newData.data]);
      setActivationCursor(newData.next_cursor);
      setHasMoreActivations(!!newData.next_cursor);
    } catch (error) {
      console.error('Error loading more activations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (isLoading) return;

      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;

      if (isNearBottom && hasMoreActivations) {
        loadMoreActivations();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLoading, hasMoreActivations, activationCursor]);

  // Fonctions de recherche existantes
  const handleSearch2 = (e) => {
    debouncedSearch(e.target.value);
    setShowSearchResults(false);
  };

  const handleSearchClick = () => {
    if (searchTerm.trim() !== '') {
      const results = filteredActivations_search;
      setSearchResults(results);

      if (results.length > 0) {
        setShowSearchResults(true);
        const firstResult = results[0];
        if (firstResult.LATITUDE_SITE && firstResult.LONGITUDE_SITE) {
          setClickedPosition({
            lat: parseFloat(firstResult.LATITUDE_SITE),
            lng: parseFloat(firstResult.LONGITUDE_SITE)
          });
        }
      } else {
        setShowSearchResults(true);
      }
    }
  };

  const debouncedSearch = useCallback(
    debounce((term) => {
      setSearchTerm(term);
    }, 300),
    []
  );

  const toggleNavbar = () => {
    setIsNavbarVisible(prevState => !prevState);
  };

  const filteredActivations_search = useMemo(() => {
    if (!searchTerm.trim()) return [];

    return activations.filter(activation => {
      const term = searchTerm.toLowerCase();
      return (
        (activation.CLIENT?.toLowerCase() || '').includes(term) ||
        (activation.MSISDN || '').includes(searchTerm) ||
        (activation.crm_case?.toString() || '').includes(searchTerm) ||
        (activation.CONTACT_CLIENT?.toString() || '').includes(searchTerm) ||
        (activation.Gouvernorat?.toLowerCase() || '').includes(term) ||
        (activation.Delegation?.toLowerCase() || '').includes(term) ||
        (activation.offre?.toLowerCase() || '').includes(term) ||
        (activation.NAME_STT?.toLowerCase() || '').includes(term)
      );
    });
  }, [activations, searchTerm]);

  const filteredActivations = useMemo(() => {
    const shouldFilterByDate = selectedDate || startDate || endDate;

    let filtered = activations.filter(activation => {
      const matchesSearch = searchTerm === '' ||
        (activation.CLIENT?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (activation.MSISDN || '').includes(searchTerm) ||
        (activation.Gouvernorat?.toLowerCase() || '').includes(searchTerm.toLowerCase());

      if (!shouldFilterByDate) return matchesSearch;

      const creationDate = safeDateParse(activation.DATE_CREATION_CRM);
      const dateString = creationDate ? creationDate.toISOString().split('T')[0] : null;

      if (!dateString) return false;

      if (filterType === 'day') {
        return (selectedDate ? dateString === selectedDate : false) && matchesSearch;
      } else if (filterType === 'period') {
        const start = startDate ? new Date(startDate).toISOString().split('T')[0] : null;
        const end = endDate ? new Date(endDate).toISOString().split('T')[0] : null;

        if (start && end) return dateString >= start && dateString <= end && matchesSearch;
        if (start) return dateString >= start && matchesSearch;
        if (end) return dateString <= end && matchesSearch;
      }

      return matchesSearch;
    });

    return filtered.sort((a, b) => {
      const dateA = safeDateParse(a.DATE_CREATION_CRM) || new Date(0);
      const dateB = safeDateParse(b.DATE_CREATION_CRM) || new Date(0);
      return dateB - dateA;
    });
  }, [activations, searchTerm, filterType, selectedDate, startDate, endDate]);
  const filteredPlaintes = useMemo(() => {
    return plaintes.filter(plainte => {
      const dateField = plainte.DATE_CREATION_CRM;

      if (!dateField) {
        console.warn("Plainte sans aucun champ de date:", plainte);
        return false;
      }

      let creationDate;
      if (dateField instanceof Date) {
        creationDate = dateField;
      } else if (typeof dateField === 'string' || typeof dateField === 'number') {
        creationDate = safeDateParse(dateField);
      }

      if (!creationDate || isNaN(creationDate.getTime())) {
        console.warn("Plainte avec date invalide:", plainte, "Date field:", dateField);
        return false;
      }

      const dateString = creationDate.toISOString().split('T')[0];

      if (filterType === 'day' && selectedDate) {
        return dateString === selectedDate;
      } else if (filterType === 'period') {
        const start = startDate ? new Date(startDate).toISOString().split('T')[0] : null;
        const end = endDate ? new Date(endDate).toISOString().split('T')[0] : null;

        if (start && end) return dateString >= start && dateString <= end;
        if (start) return dateString >= start;
        if (end) return dateString <= end;
      }

      return true;
    });
  }, [plaintes, filterType, selectedDate, startDate, endDate]);

  const filteredResiliations = useMemo(() => resiliation.filter(res => {
    const creationDate = safeDateParse(res.date_creation_crm);
    const dateString = creationDate ? creationDate.toISOString().split('T')[0] : null;

    if (!dateString) return false;

    if (filterType === 'day') {
      return selectedDate ? dateString === selectedDate : false;
    } else if (filterType === 'period') {
      const start = startDate ? new Date(startDate).toISOString().split('T')[0] : null;
      const end = endDate ? new Date(endDate).toISOString().split('T')[0] : null;
      if (start && end) {
        return dateString >= start && dateString <= end;
      } else if (start) {
        return dateString >= start;
      } else if (end) {
        return dateString <= end;
      }
      return false;
    }
    return false;
  }), [resiliation, filterType, selectedDate, startDate, endDate]);

  return (
    <div className="zm-dashboard">
      <NavbarHorizontal />
      <div className="zm-content">
        <NavbarVertical isVisible={isNavbarVisible} toggleNavbar={toggleNavbar} />
        <div className={`zm-main ${isNavbarVisible ? 'nav-expanded' : 'nav-collapsed'}`}>
          <div className="zm-tabDashs">
            <button
              className={`zm-tabDash ${activeTab === 'map' ? 'active' : ''}`}
              onClick={() => setActiveTab('map')}
            >
              Carte
            </button>
            <button
              className={`zm-tabDash ${activeTab === 'stats' ? 'active' : ''}`}
              onClick={() => setActiveTab('stats')}
            >
              Statistiques STT
            </button>
            <div className="search-filter_act">
              <SearchBar2
                onChange={handleSearch2}
                onSearch={handleSearchClick}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && searchTerm.trim() !== '') {
                    handleSearchClick();
                  }
                }}
              />
            </div>
            {showSearchResults && (
              <div className="search-results-popup">
                <div className="popup-content">
                  <div className="popup-header">
                    <h3>Résultats de recherche ({searchResults.length})</h3>
                    <button
                      className="close-btnDash"
                      onClick={() => setShowSearchResults(false)}
                    >
                      ×
                    </button>
                  </div>
                  <div className="results-container">
                    {searchResults.length > 0 ? (
                      <>
                        <table className="results-table">
                          <thead>
                            <tr>
                              <th>MSISDN</th>
                              <th>Statut</th>
                              <th>Client</th>
                              <th>Contact client</th>
                              <th>Gouvernorat</th>
                              <th>Delegation</th>
                              <th>STT</th>
                              <th>Pack</th>
                              <th>CGPS</th>
                              <th>DATE_CREATION_CRM</th>
                              <th>DATE_AFFECTATION_STT</th>
                            </tr>
                          </thead>
                          <tbody>
                            {searchResults.slice(0, 10).map((activation) => (
                              <tr
                                key={activation.id}
                                onClick={() => {
                                  setSelectedClient(activation);
                                  setShowClientPopup(true);
                                  setClickedPosition({
                                    lat: parseFloat(activation.LATITUDE_SITE),
                                    lng: parseFloat(activation.LONGITUDE_SITE)
                                  });
                                }}
                                style={{ cursor: 'pointer' }}
                              >
                                <td>{activation.MSISDN}</td>
                                <td>{activation.STATUT}</td>
                                <td>{activation.CLIENT}</td>
                                <td>{activation.CONTACT_CLIENT}</td>
                                <td>{activation.Gouvernorat}</td>
                                <td>{activation.Delegation}</td>
                                <td>{activation.NAME_STT}</td>
                                <td>{activation.DES_PACK}</td>
                                <td>{activation.LATITUDE_SITE},{activation.LONGITUDE_SITE}</td>
                                <td>
                                  {safeDateParse(activation.DATE_CREATION_CRM)?.toLocaleString('fr-FR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit'
                                  }) || 'N/A'}
                                </td>
                                <td>
                                  {new Date(activation.DATE_AFFECTATION_STT).toLocaleString('fr-FR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit'
                                  })}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="map-highlight">
                          <p>Les résultats sont également affichés sur la carte</p>
                        </div>
                      </>
                    ) : (
                      <p>Aucune activation trouvée pour "{searchTerm}"</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {showFilter && (
            <FilterComponent
              filterType={filterType}
              setFilterType={setFilterType}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              errorMessage={errorMessage}
              setErrorMessage={setErrorMessage}
              dataType={dataType}
              setDataType={setDataType}
            />
          )}

          {activeTab === 'map' ? (
            <div className="map-and-stats-container">
              <div className="map-and-cards-row">
                <div className="map-container">
           <MapComponent
  clickedPosition={clickedPosition}
  setClickedPosition={setClickedPosition}
  onGouvernoratSelect={handleGouvernoratSelect}
  filteredActivations={mapDisplayData.activations}
  filteredPlaintes={mapDisplayData.plaintes}
  filteredResiliations={mapDisplayData.resiliations}
  dataType={dataType}
/>
                </div>
               <div className="status-cards-wrapper">
  <StatusCardsComponent 
  data={statusCounts} 
  dataType={dataType} 
  onStatusClick={(statusType, action) => {
    if (action === 'reset') {
      setGouvernorat(null);
      showDefaultMapData();
    } else {
      filterDataByStatus(statusType, dataType);
    }
  }}
  gouvernorat={gouvernorat}
/>
</div>
             {showStatusPopup && filteredByStatus?.data && (
  <div className="status-popup-overlayDash">
    <div className="status-popup">
      <div className="popup-headerDash">
        <h3>Détails des demandes - Statut : {filteredByStatus.statusType}</h3>
        <button className="close-btnDash" onClick={closeStatusPopup}>×</button>
      </div>

      <div className="status-results-container">
        <div className="results-section">
          <h4>
            {filteredByStatus.dataType === 'activations'
              ? 'Activations'
              : filteredByStatus.dataType === 'plaintes'
              ? 'Plaintes'
              : 'Toutes demandes'} 
            ({filteredByStatus.data.length})
          </h4>

          <div className="results-table-container">
            <table className="results-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>MSISDN</th>
                  <th>Contact</th>
                  <th>Gouvernorat</th>
                  <th>STT</th>
                  <th>Date Création</th>
                </tr>
              </thead>
              <tbody>
                {getCurrentItems(filteredByStatus.data).map((item, index) => (
                  <tr
                    key={index}
                    onClick={() => {
                      setSelectedClient(item);
                      setShowClientPopup(true);
                      if (item.LATITUDE_SITE && item.LONGITUDE_SITE) {
                        setClickedPosition({
                          lat: parseFloat(item.LATITUDE_SITE),
                          lng: parseFloat(item.LONGITUDE_SITE),
                        });
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>{item.CLIENT}</td>
                    <td>{item.MSISDN}</td>
                    <td>{item.CONTACT_CLIENT}</td>
                    <td>{item.Gouvernorat}</td>
                    <td>{item.NAME_STT}</td>
                    <td>
                      {safeDateParse(item.DATE_CREATION_CRM)?.toLocaleString() || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination controls */}
          <div className="pagination-controls">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Précédent
            </button>
            <span>
              Page {currentPage} sur {Math.ceil(filteredByStatus.data.length / itemsPerPage)}
            </span>
            <button 
              onClick={() => setCurrentPage(prev =>
                Math.min(prev + 1, Math.ceil(filteredByStatus.data.length / itemsPerPage))
              )}
              disabled={currentPage === Math.ceil(filteredByStatus.data.length / itemsPerPage)}
            >
              Suivant
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
)}

              </div>
              <div className="stats-container-bottom">
                <GouvDashboardStats data={statusCounts} dataType={dataType} onStatusClick={filterDataByStatus} />
              </div>
            </div>
          ) : (
            <div className="zm-stt-stats">
              {sttData && (
                <STTStatisticsComponent
                  sttData={sttData}
                  selectedDate={selectedDate}
                  startDate={startDate}
                  endDate={endDate}
                />
              )}
            </div>
          )}

          {showClientPopup && selectedClient && (
            <div className="client-popup-overlayDash">
              <div className="client-popupDash">
                <div className="popup-headerDash">

                  <h3>Détails du Client</h3>
                  <button
                    className="close-btnDash"
                    onClick={() => setShowClientPopup(false)}
                  >
                    ×
                  </button>
                </div>
                <div className="client-details">
                  <p><strong>Client:</strong> {selectedClient.CLIENT}</p>
                  <p><strong>MSISDN:</strong> {selectedClient.MSISDN}</p>
                  <p><strong>Contact:</strong> {selectedClient.CONTACT_CLIENT}</p>
                  <p><strong>Gouvernorat:</strong> {selectedClient.Gouvernorat}</p>
                  <p><strong>Délégation:</strong> {selectedClient.Delegation}</p>
                  <p><strong>STT:</strong> {selectedClient.NAME_STT}</p>
                  <p><strong>Pack:</strong> {selectedClient.DES_PACK}</p>
                  <p><strong>Position:</strong> {selectedClient.LATITUDE_SITE}, {selectedClient.LONGITUDE_SITE}</p>
                  <p><strong>Date création:</strong> {safeDateParse(selectedClient.DATE_CREATION_CRM)?.toLocaleString() || 'N/A'}</p>
                  <p><strong>Statut:</strong> {selectedClient.STATUT}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ZMDashboard; 