/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import axios from "axios";
import useUserData from "../hooks/useUserData";
import Navbar from "../navbar/Navbar";
import Sidebar from "../navbar/Sidebar";
import Complaints from "./Complaints";
import Resiliations from "./Resiliations";

import "./task.css";
import {
  FiChevronRight,
  FiCalendar,
  FiPhone,
  FiMapPin,
  FiTool,
  FiClock,
  FiInfo,
  FiSearch,
  FiFilter,
  FiAlertTriangle,
  FiXCircle,
  FiUser,
  FiCheck,
  FiMap,
  FiX
} from "react-icons/fi";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const TABS = {
  ACTIVATIONS: 'activations',
  COMPLAINTS: 'complaints',
  TERMINATIONS: 'terminations'
};

const TaskPage = () => {
  const { user } = useUserData();
  const [activeTab, setActiveTab] = useState(TABS.ACTIVATIONS);
  const [activations, setActivations] = useState([]);
  const [selectedActivations, setSelectedActivations] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [terminations, setTerminations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [technicianStatusCounts, setTechnicianStatusCounts] = useState({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    status: "",
    gouvernorat: "",
    crm_case: "",
    MSISDN: "",
    startDate: "",
    endDate: "",
    search: ""
  });
  const [complaintsData, setComplaintsData] = useState({
  data: [],
  total: 0,
  stats: {
    total: 0,
    terminé: 0,
    enCours: 0,
    abandonné: 0
  }
});
  const [selectedTask, setSelectedTask] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [technicians, setTechnicians] = useState({});
  const [selectedTechnician, setSelectedTechnician] = useState(null);
  const [showTechnicianSelect, setShowTechnicianSelect] = useState(false);
  const [selectedGovernorate, setSelectedGovernorate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (filters.search !== "") {
        fetchData(false);
      } else if (filters.search === "" && (filters.status || filters.gouvernorat || filters.startDate || filters.endDate)) {
        fetchData(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [filters.search, filters.status, filters.gouvernorat, filters.startDate, filters.endDate]);

  useEffect(() => {
    if (user?.company?.id) {
      fetchData();
      fetchTechnicians();
    }
  }, [user, pagination.page, filters, activeTab]);

  const fetchData = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.status && { STATUT: filters.status }),
        ...(filters.gouvernorat && { gouvernorat: filters.gouvernorat }),
        ...(filters.startDate && { DATE_AFFECTATION_STT: filters.startDate }),
        ...(filters.endDate && { DATE_PRISE_RDV: filters.endDate }),
        ...(filters.search && { searchTerm: filters.search.trim() })
      };

      const response = await axios.get(`http://localhost:3000/activation/company/${user.company.id}`, { params });

      setActivations(response.data.data);
      setPagination({
        ...pagination,
        total: response.data.total,
      });
    } catch (error) {
      setError("Erreur lors de la récupération des données");
      console.error(error);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const response = await axios.get(
        `http://localhost:3000/branches/${user.company.id}/technicians-by-gov`
      );
      if (response.data && typeof response.data === 'object') {
        setTechnicians(response.data);
      } else {
        console.error("Structure de réponse inattendue:", response);
        setTechnicians({});
      }
    } catch (err) {
      console.error("Error fetching technicians:", err);
      setTechnicians({});
    }
  };

  const fetchTechnicianStatusCounts = async (governorate, sttId) => {
  try {
    const govKey = governorate?.toLowerCase() || "";

    const techniciansForGov = technicians[govKey] || [];

    console.log("technicians", technicians);
    console.log("govKey", govKey);
    console.log("techniciansForGov", techniciansForGov);

    if (!techniciansForGov || techniciansForGov.length === 0) {
      console.warn(`Aucun technicien trouvé pour le gouvernorat: ${governorate}`);
      setTechnicianStatusCounts({});
      return;
    }

    const counts = {};

    await Promise.all(
      techniciansForGov.map(async (tech) => {
        try {
          const response = await axios.get(`http://localhost:3000/activation/count-by-status-tech`, {
            params: {
              technicianId: tech.id,
              Gouv: govKey,
              sttId:user.company.id,
            }
          });
          if (response.data && Array.isArray(response.data)) {
            const totalCount = response.data.reduce((sum, item) => sum + item.count, 0);
            counts[tech.id] = totalCount;
          } else {
            console.warn(`Structure de réponse inattendue pour le technicien ${tech.id}:`, response.data);
            counts[tech.id] = 0;
          }
        } catch (error) {
          console.error(`Erreur pour le technicien ${tech.id}:`, error);
          counts[tech.id] = 0;
        }
      })
    );

    console.log("Counts après traitement:", counts);
    setTechnicianStatusCounts(counts);
  } catch (error) {
    console.error("Erreur globale lors de la récupération des comptes:", error);
    setTechnicianStatusCounts({});
  }
};
const fetchTechniciansForGovernorate = (governorate) => {
  const normalizedGov = governorate.toLowerCase();
  const techniciansForGov = technicians[normalizedGov] || [];
  const newTechnicians = {};
  newTechnicians[normalizedGov] = techniciansForGov;
  setTechnicians(prev => ({
    ...prev,
    ...newTechnicians,
  }));
  const sttId = selectedActivations.length > 0 ? selectedActivations[0].sttId : null;
  fetchTechnicianStatusCounts(normalizedGov, sttId);
};

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPagination({ ...pagination, page: 1 });
    resetFilters();
    setSelectedActivations([]);
    setShowMap(false);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
    setPagination({ ...pagination, page: 1 });
  };

  const handleSearchChange = (e) => {
    setFilters({
      ...filters,
      search: e.target.value
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };
  const handlePageChange = (newPage) => {
    setPagination({
      ...pagination,
      page: newPage,
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR");
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("fr-FR");
  };

  const handleRowClick = (task) => {
    setSelectedTask(task);
    setShowDetails(true);
  };

  const handleActivationSelect = (activation, e) => {
    e.stopPropagation();
    setSelectedActivations(prev => {
      const isSelected = prev.some(a => a.crm_case === activation.crm_case);
      if (isSelected) {
        return prev.filter(a => a.crm_case !== activation.crm_case);
      } else {
        return [...prev, activation];
      }
    });
  };

  const resetFilters = () => {
    setFilters({
      status: "",
      gouvernorat: "",
      startDate: "",
      endDate: "",
      search: ""
    });
  };

  const handleAssignTechnician = async () => {
    if (selectedActivations.length === 0 || !selectedTechnician) return;

    const params = {
      activationIds: selectedActivations.map(activation => activation.crm_case),
      technicianId: selectedTechnician.id,
      companyId: user.company.id,
    };

    try {
      const response = await axios.put(`http://localhost:3000/activation/assign-delegation`, params);
      console.log("Activations assignées:", response.data);
      setSelectedActivations([]);
      setSelectedTechnician(null);
      setShowTechnicianSelect(false);
      alert("Affectation réussie !");
    } catch (error) {
      console.error("Erreur lors de l'affectation :", error);
      alert("Erreur lors de l'affectation des activations.");
    }
  };

  const toggleSelectionOnMapClick = (activation) => {
    setSelectedActivations(prev => {
      const isSelected = prev.some(a => a.crm_case === activation.crm_case);
      if (isSelected) {
        return prev.filter(a => a.crm_case !== activation.crm_case);
      } else {
        return [...prev, activation];
      }
    });
  };

  const renderActivations = () => (
    <>
      <div className="activations-actions">
        {selectedActivations.length > 0 && (
          <>
            <button
              className="show-map-btn"
              onClick={() => setShowMap(!showMap)}
            >
              <FiMap /> {showMap ? 'Masquer la carte' : 'Afficher sur la carte'}
            </button>
            <button
              className="assign-btn"
              onClick={() => {
              const governorateToUse = selectedActivations[0]?.Gouvernorat?.toLowerCase() || "";
                if (governorateToUse) {
                  setSelectedGovernorate(governorateToUse);
                  fetchTechniciansForGovernorate(governorateToUse);
                  setShowTechnicianSelect(true);
                } else {
                  alert("Veuillez sélectionner une activation d'abord.");
                }
              }}
            >
              <FiUser /> Assigner un technicien
            </button>
            <span className="selected-count">
              {selectedActivations.length} sélectionné(s)
            </span>
            <button
              className="clear-selection"
              onClick={() => setSelectedActivations([])}
            >
              <FiX /> Annuler
            </button>
          </>
        )}
      </div>

      {showMap && selectedActivations.length > 0 && (
        <div className="map-container">
          <MapContainer
            center={[34, 9]}
            zoom={6}
            style={{ height: '400px', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {selectedActivations.map(activation => (
              activation.LATITUDE_SITE && activation.LONGITUDE_SITE && (
                <Marker
                  key={activation.crm_case}
                  position={[parseFloat(activation.LATITUDE_SITE), parseFloat(activation.LONGITUDE_SITE)]}
                  eventHandlers={{
                    click: () => toggleSelectionOnMapClick(activation),
                  }}
                >
                  <Popup>
                    <strong>#{activation.crm_case}</strong><br />
                    {activation.CLIENT}<br />
                    {activation.Gouvernorat}, {activation.Delegation}<br />
                    <small>{activation.STATUT}</small>
                  </Popup>
                </Marker>
              )
            ))}
          </MapContainer>
        </div>
      )}

      {showTechnicianSelect && selectedActivations.length > 0 && (
        <div className="technician-select-modal">
          <div className="technician-select-content">
            <div className="modal-header">
              <h3>Assigner un technicien</h3>
              <button className="close-modal" onClick={() => setShowTechnicianSelect(false)}>
                ×
              </button>
            </div>

            <div className="selection-info">
              <p><strong>{selectedActivations.length}</strong> activation(s) sélectionnée(s)</p>
              <p>Gouvernorat: <strong>{selectedGovernorate || "Non spécifié"}</strong></p>
            </div>

            <div className="technician-filters">
              <label>Gouvernorat:</label>
              <select
                value={selectedGovernorate}
                onChange={(e) => {
                  setSelectedGovernorate(e.target.value);
                  setSelectedTechnician(null);
                }}
              >
                <option value="">Sélectionner un gouvernorat</option>
                {Object.keys(technicians).map(gov => (
                  <option key={gov} value={gov}>{gov}</option>
                ))}
              </select>
            </div>

            <div className="technicians-list">
              {renderTechnicianList()}

            </div>

            <div className="technician-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowTechnicianSelect(false)}
              >
                Annuler
              </button>
              <button
                className="confirm-btn"
                onClick={handleAssignTechnician}
                disabled={!selectedTechnician}
              >
                Confirmer l'assignation
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="activations-list">
        {activations.map((activation) => (
          <div
            key={activation.crm_case}
            className={`activation-card ${selectedActivations.some(a => a.crm_case === activation.crm_case) ? 'selected' : ''}`}
            onClick={() => handleRowClick(activation)}
          >
            <div className="activation-select">
              {activation.STATUT === 'En cours' && (
                <input
                  type="checkbox"
                  checked={selectedActivations.some(a => a.crm_case === activation.crm_case)}
                  onChange={(e) => handleActivationSelect(activation, e)}
                  onClick={(e) => e.stopPropagation()}
                />
              )}
            </div>

            <div className="activation-main">
              <span className="crm-case">#{activation.crm_case}</span>
              <h3>{activation.CLIENT}</h3>
              <div className="activation-meta">
                <span className="gouvernorat">
                  <FiMapPin /> {activation.Gouvernorat}
                </span>
                <span className="delegation">{activation.Delegation}</span>
                <span className="msisdn">
                  <FiPhone /> {activation.MSISDN}
                </span>
              </div>
            </div>

            <div className="activation-status">
              <span className={`status-badge ${activation.STATUT.toLowerCase().replace(" ", "-")}`}>
                {activation.STATUT}
              </span>
              <span className="sla">
                <FiClock /> {activation.SLA_STT?.toFixed(2) || 'N/A'}h
              </span>
            </div>

            <FiChevronRight className="chevron-icon" />
          </div>
        ))}
      </div>

      {activations.length > 0 && (
        <div className="pagination">
          <button
            disabled={pagination.page === 1}
            onClick={() => handlePageChange(pagination.page - 1)}
          >
            Précédent
          </button>
          <span>
            Page {pagination.page} sur {Math.ceil(pagination.total / pagination.limit)}
          </span>
          <button
            disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
            onClick={() => handlePageChange(pagination.page + 1)}
          >
            Suivant
          </button>
        </div>
      )}
    </>
  );

  const renderComplaints = () => (
    <Complaints 
    companyId={user?.company?.id} 
    filters={filters}
    />
  );

    const renderTerminations = () => (
    <Resiliations
    companyId={user?.company?.id} 
    filters={filters}
    />
  );


  const renderDetails = () => {
    if (!selectedTask) return null;

    if (activeTab === TABS.ACTIVATIONS) {
      return (
        <>
          <div className="modal-header">
            <h2>
              <span className="crm-case">#{selectedTask.crm_case}</span>
              {selectedTask.CLIENT}
            </h2>
            <span className={`status-badge large ${selectedTask.STATUT.toLowerCase().replace(" ", "-")}`}>
              {selectedTask.STATUT}
            </span>
          </div>

          <div className="details-grid">
            <div className="details-section">
              <h3><FiInfo /> Informations client</h3>
              <p><strong>Client:</strong> {selectedTask.CLIENT}</p>
              <p><strong>Contact:</strong> {selectedTask.CONTACT_CLIENT}</p>
              <p><strong>MSISDN:</strong> {selectedTask.MSISDN}</p>
              <p><strong>Offre:</strong> {selectedTask.offre}</p>
              <p><strong>Pack:</strong> {selectedTask.DES_PACK}</p>
            </div>

            <div className="details-section">
              <h3><FiMapPin /> Localisation</h3>
              <p><strong>Gouvernorat:</strong> {selectedTask.Gouvernorat}</p>
              <p><strong>Délégation:</strong> {selectedTask.Delegation}</p>
              <p><strong>Coordonnées GPS:</strong> {selectedTask.LATITUDE_SITE}, {selectedTask.LONGITUDE_SITE}</p>
              <p><strong>Agence:</strong> {selectedTask.branch?.name || '-'}</p>
              <p><strong>STT:</strong> {selectedTask.NAME_STT}</p>
            </div>

            <div className="details-section">
              <h3><FiTool /> Intervention</h3>
              <p><strong>Réponse travaux:</strong> {selectedTask.REP_TRAVAUX_STT}</p>
              <p><strong>Métrage câble:</strong> {selectedTask.METRAGE_CABLE || '-'}m</p>
              <p><strong>Réponse RDV:</strong> {selectedTask.REP_RDV}</p>
              <p><strong>Commentaire RDV:</strong> {selectedTask.CMT_RDV}</p>
            </div>

            <div className="details-section">
              <h3><FiCalendar /> Dates clés</h3>
              <p><strong>Création CRM:</strong> {formatDateTime(selectedTask.DATE_CREATION_CRM)}</p>
              <p><strong>Ouverture Timos:</strong> {formatDateTime(selectedTask.OPENING_DATE_SUR_TIMOS)}</p>
              <p><strong>Affectation STT:</strong> {formatDateTime(selectedTask.DATE_AFFECTATION_STT)}</p>
              <p><strong>Prise RDV:</strong> {formatDateTime(selectedTask.DATE_PRISE_RDV)}</p>
              <p><strong>Fin travaux:</strong> {formatDateTime(selectedTask.DATE_FIN_TRV)}</p>
            </div>

            <div className="details-section">
              <h3><FiClock /> Indicateurs</h3>
              <p><strong>SLA STT:</strong> {selectedTask.SLA_STT?.toFixed(2) || '-'}h</p>
              <p><strong>Temps prise RDV:</strong> {selectedTask.TEMPS_MOYEN_PRISE_RDV?.toFixed(2) || '-'}h</p>
              <p><strong>Dernière synchro:</strong> {formatDateTime(selectedTask.last_sync)}</p>
            </div>
          </div>
        </>
      );
    }

    return null;
  };

  const renderTechnicianList = () => (
    selectedGovernorate && technicians[selectedGovernorate]?.length > 0 ? (
      technicians[selectedGovernorate].map(tech => (
        <div
          key={tech.id}
          className={`technician-card ${selectedTechnician?.id === tech.id ? 'selected' : ''}`}
          onClick={() => setSelectedTechnician(tech)}
        >
          <div className="technician-info">
            <h4>{tech.nom} {tech.prénom}</h4>
            <p><FiPhone /> {tech.num_tel}</p>
            <p className={`availability ${tech.disponibilité ? 'available' : 'unavailable'}`}>
              {tech.disponibilité ? 'Disponible' : 'Non disponible'}
            </p>
            <p><strong>Activations en cours:</strong> {technicianStatusCounts[tech.id] || 0}</p>
          </div>
          {selectedTechnician?.id === tech.id && <FiCheck className="check-icon" />}
        </div>
      ))
    ) : (
      <div className="no-technicians">
        <FiInfo /> Aucun technicien disponible pour ce gouvernorat
      </div>
    )
  );
  return (
    <div className="dashboard-container">
      <Navbar />
      <Sidebar />

      <div className="main-content4">
        <div className="task-container">
          <div className="task-header">

            <div className="tabs">
              <button
                className={`tab ${activeTab === TABS.ACTIVATIONS ? 'active' : ''}`}
                onClick={() => handleTabChange(TABS.ACTIVATIONS)}
              >
                Activations
              </button>
              <button
                className={`tab ${activeTab === TABS.COMPLAINTS ? 'active' : ''}`}
                onClick={() => handleTabChange(TABS.COMPLAINTS)}
              >
                Plaintes
              </button>
              <button
                className={`tab ${activeTab === TABS.TERMINATIONS ? 'active' : ''}`}
                onClick={() => handleTabChange(TABS.TERMINATIONS)}
              >
                Résiliations
              </button>
            </div>

            <div className="summary-cards">
              <div className="summary-card total">
                <span>Total</span>
                <strong>
                  {activeTab === TABS.ACTIVATIONS ? pagination.total :
                    activeTab === TABS.COMPLAINTS ? 0 : 0}
                </strong>
              </div>
              <div className="summary-card terminé">
                <span>Terminées</span>
                <strong>
                  {activeTab === TABS.ACTIVATIONS ? activations.filter(a => a.STATUT === 'Terminé').length : 0}
                </strong>
              </div>
              <div className="summary-card enCours">
                <span>En cours</span>
                <strong>
                  {activeTab === TABS.ACTIVATIONS ? activations.filter(a => a.STATUT === 'En cours').length : 0}
                </strong>
              </div>
              <div className="summary-card abandonné">
                <span>
                  {activeTab === TABS.ACTIVATIONS ? 'Abandonnées' :
                    activeTab === TABS.COMPLAINTS ? 'Critiques' : 'Annulées'}
                </span>
                <strong>
                  {activeTab === TABS.ACTIVATIONS ? activations.filter(a => a.STATUT === 'Abandonné').length : 0}
                </strong>
              </div>
            </div>
          </div>

          <div className="filters-container4">
            <div
              className={`filter-toggle ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <FiFilter />
              <span>Filtres</span>
              <FiChevronRight className={`chevron ${showFilters ? 'rotate' : ''}`} />
            </div>
          </div>
          <div className={`filter-content ${showFilters ? 'expanded' : ''}`}>

            <div className="search-bar4">
              <input
                type="text"
                placeholder="Rechercher par numéro CRM, client ou téléphone..."
                value={filters.search}
                onChange={handleSearchChange}
                onKeyPress={(e) => e.key === 'Enter' && fetchData()}
              />
              <button className="btnRech" onClick={fetchData}><FiSearch className="search-icon4" /></button>
            </div>

            <div className="filter-group4">
              {(activeTab === TABS.ACTIVATIONS || activeTab === TABS.TERMINATIONS || activeTab === TABS.COMPLAINTS) && (
                <>
                  <div className="filter-item4">
                    <label><FiFilter /> Statut</label>
                    <select
                      name="status"
                      value={filters.status}
                      onChange={handleFilterChange}
                    >
                      <option value="">Tous les statuts</option>
                      <option value="Terminé">Terminé</option>
                      <option value="Gelé">Gelé</option>
                      <option value="En cours">En cours</option>
                      <option value="Abandonné">Abandonnée</option>
                    </select>
                  </div>

                  <div className="filter-item4">
                    <label><FiMapPin /> Gouvernorat</label>
                   <select
  name="gouvernorat"
  value={filters.gouvernorat}
  onChange={handleFilterChange}
>
  <option value="">Tous les gouvernorats</option>
  <option value="ariana">Ariana</option>
  <option value="beja">Béja</option>
  <option value="ben arous">Ben Arous</option>
  <option value="bizerte">Bizerte</option>
  <option value="gabes">Gabès</option>
  <option value="gafsa">Gafsa</option>
  <option value="jendouba">Jendouba</option>
  <option value="kairouan">Kairouan</option>
  <option value="kasserine">Kasserine</option>
  <option value="kebili">Kébili</option>
  <option value="kef">Le Kef</option>
  <option value="mahdia">Mahdia</option>
  <option value="mannouba">La Manouba</option>
  <option value="medenine">Médenine</option>
  <option value="monastir">Monastir</option>
  <option value="nabeul">Nabeul</option>
  <option value="sfax">Sfax</option>
  <option value="sidi bouzid">Sidi Bouzid</option>
  <option value="siliana">Siliana</option>
  <option value="sousse">Sousse</option>
  <option value="tataouine">Tataouine</option>
  <option value="tozeur">Tozeur</option>
  <option value="tunis">Tunis</option>
  <option value="zaghouan">Zaghouan</option>
</select>
                  </div>
                </>
              )}

              <div className="filter-item4">
                <label><FiCalendar /> Date début</label>
                <input
                  type="date"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                />
              </div>

              <div className="filter-item4">
                <label><FiCalendar /> Date fin</label>
                <input
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                />
              </div>

              <button className="reset-filters" onClick={resetFilters}>
                Réinitialiser
              </button>
            </div>
          </div>

          {loading ? (
            <div className="spinner-container">
              <div className="spinner-ring"></div>
            </div>
          ) : error ? (
            <div className="error-message"><FiInfo /> {error}</div>
          ) : (
            <>
              {activeTab === TABS.ACTIVATIONS && renderActivations()}
              {activeTab === TABS.COMPLAINTS && renderComplaints()}
              {activeTab === TABS.TERMINATIONS && renderTerminations()}
            </>
          )}
        </div>
      </div>

      {showDetails && selectedTask && (
        <div className="modal-overlaySTTP" onClick={() => setShowDetails(false)}>
          <div className="modal-contentSTTP" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setShowDetails(false)}>
              ×
            </button>
            {renderDetails()}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskPage;