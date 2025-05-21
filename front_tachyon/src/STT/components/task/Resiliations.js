import React, { useEffect, useState } from "react";
import axios from "axios";
import useUserData from "../hooks/useUserData";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  FiCalendar,
  FiPhone,
  FiMapPin,
  FiInfo,
  FiChevronRight,
  FiClock,
  FiTool,
  FiUser,
  FiCheck,
  FiMap,
  FiX,
} from "react-icons/fi";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});
const Resiliations = ({ companyId, filters }) => {
  const [resiliations, setResiliations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedResiliations, setSelectedPlaintes] = useState([]);
  const [showMap, setShowMap] = useState(false);
  const [technicians, setTechnicians] = useState({});
  const [selectedTechnician, setSelectedTechnician] = useState(null);
  const [showTechnicianSelect, setShowTechnicianSelect] = useState(false);
  const [selectedGovernorate, setSelectedGovernorate] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const handleRowClick = (task) => {
  setSelectedTask(task);
  setShowDetails(true);
};
const renderComplaintDetails = () => {
  if (!selectedTask) return null;
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
          <p><strong>Description:</strong> {selectedTask.DESCRIPTION}</p>
          <p><strong>Contact:</strong> {selectedTask.CONTACT_CLIENT}</p>
          <p><strong>MSISDN:</strong> {selectedTask.MSISDN}</p>
          <p><strong>Type resiliation:</strong> {selectedTask.TYPE_PLAINTE || '-'}</p>
        </div>

        <div className="details-section">
          <h3><FiMapPin /> Localisation</h3>
          <p><strong>Gouvernorat:</strong> {selectedTask.Gouvernorat}</p>
          <p><strong>Délégation:</strong> {selectedTask.Delegation}</p>
          <p><strong>CGPS:</strong> {selectedTask.LONGITUDE_SITE || '-'} , {selectedTask.LATITUDE_SITE || '-'}</p>
        </div>

        <div className="details-section">
          <h3><FiTool /> Détails resiliation</h3>
          <p><strong>Detail:</strong> {selectedTask.Detail || '-'}</p>
          <p><strong>STT:</strong> {selectedTask.STT || '-'}</p>
          <p><strong>DATE AFFECTATION STT:</strong> {selectedTask.DATE_AFFECTATION_STT || '-'}</p>
        </div>

        <div className="details-section">
          <h3><FiCalendar /> Dates clés</h3>
          <p><strong>Date Création:</strong> {formatDateTime(selectedTask.DATE_CREATION_CRM)}</p>
          <p><strong>Date ouverture timos:</strong> {formatDateTime(selectedTask.OPENING_DATE_SUR_TIMOS)}</p>
          <p><strong>Date affectation STT:</strong> {formatDateTime(selectedTask.DATE_AFFECTATION_STT)}</p>
          <p><strong>Date prise RDV:</strong> {formatDateTime(selectedTask.DATE_PRISE_RDV)}</p>
          <p><strong>Date résolution:</strong> {formatDateTime(selectedTask.DATE_FIN_TRV)}</p>
        </div>

        <div className="details-section">
          <h3><FiClock /> Indicateurs</h3>
          <p><strong>SLA Travaux :</strong> {selectedTask.SLA_STT || '-'}h</p>
          <p><strong>SLA RDV:</strong> {selectedTask.TEMPS_MOYEN_PRISE_RDV || '-'}h</p>
        </div>
      </div>
    </>
  );
};
const formatDateTime = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleString("fr-FR");
};
  const renderTechnicianList = () => {
    if (!selectedGovernorate || !technicians[selectedGovernorate]) {
      return <div>Aucun technicien disponible</div>;
    }

    return technicians[selectedGovernorate].map(tech => (
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
        </div>
        {selectedTechnician?.id === tech.id && <FiCheck className="check-icon" />}
      </div>
    ));
  };
  const { user } = useUserData();
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });
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
      console.error("Erreur lors de la récupération des techniciens :", err);
      setTechnicians({});
    }
  };
  const handleAssignTechnician = async () => {
    if (selectedResiliations.length === 0 || !selectedTechnician) return;

    const params = {
      resiliationIds: selectedResiliations.map(p => p.crm_case),
      technicianId: selectedTechnician.id,
      companyId: user.company.id,
    };

    try {
      const response = await axios.put(`http://localhost:3000/resiliation/assign-delegation`, params);
      console.log("Plaintes assignées:", response.data);
      setSelectedPlaintes([]);
      setSelectedTechnician(null);
      setShowTechnicianSelect(false);
      alert("Affectation réussie !");
    } catch (error) {
      console.error("Erreur lors de l'affectation :", error);
      alert("Erreur lors de l'affectation des resiliations.");
    }
  };
  useEffect(() => {
    fetchTechnicians();
  }, []);
  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.status && { STATUT: filters.status }),
        ...(filters.gouvernorat && { gouvernorat: filters.gouvernorat }),
        ...(filters.startDate && { DATE_AFFECTATION_STT: filters.startDate }),
        ...(filters.endDate && { DATE_PRISE_RDV: filters.endDate }),
        ...(filters.search && { searchTerm: filters.search.trim() })
      };


      const response = await axios.get(
        `http://localhost:3000/resiliation/company/${companyId}`,
        { params }
      );

      setResiliations(response.data.data);
      setPagination(prev => ({
        ...prev,
        total: response.data.total,
      }));
    } catch (err) {
      setError("Erreur lors du chargement des resiliations");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchComplaints();
    }, 500);

    return () => clearTimeout(timer);
  }, [filters, pagination.page]);

  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [filters.status, filters.gouvernorat, filters.startDate, filters.endDate, filters.search]);

  const handlePlainteSelect = (resiliation, e) => {
    e.stopPropagation();
    setSelectedPlaintes(prev => {
      const isSelected = prev.some(a => a.crm_case === resiliation.crm_case);
      if (isSelected) {
        return prev.filter(a => a.crm_case !== resiliation.crm_case);
      } else {
        return [...prev, resiliation];
      }
    });
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({
      ...prev,
      page: newPage,
    }));
  };



  if (loading) return <div className="spinner-container">
    <div className="spinner-ring"></div>
  </div>;

  if (error) return <div className="error-message"><FiInfo /> {error}</div>;

  return (
    <div className="activation-container">
      <div className="activations-actions">
        {selectedResiliations.length > 0 && (
          <>
            <button className="show-map-btn" onClick={() => setShowMap(!showMap)}>
              <FiMap /> {showMap ? 'Masquer la carte' : 'Afficher sur la carte'}
            </button>
            <button
              className="assign-btn"
              onClick={() => {
                const governorateToUse = selectedResiliations[0]?.Gouvernorat || "";
                if (governorateToUse) {
                  setSelectedGovernorate(governorateToUse);
                  setShowTechnicianSelect(true);
                } else {
                  alert("Veuillez sélectionner une resiliation d'abord.");
                }
              }}
            >
              <FiUser /> Assigner un technicien
            </button>
            <span className="selected-count">
              {selectedResiliations.length} sélectionné(s)
            </span>
            <button className="clear-selection" onClick={() => setSelectedPlaintes([])}>
              <FiX /> Annuler
            </button>
          </>
        )}
      </div>
      {showMap && selectedResiliations.length > 0 && (
        <div className="map-container">
          <MapContainer center={[34, 9]} zoom={6} style={{ height: '400px', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {selectedResiliations.map(resiliation => (
              resiliation.LATITUDE_SITE && resiliation.LONGITUDE_SITE && (
                <Marker key={resiliation.crm_case}
                  position={[parseFloat(resiliation.LATITUDE_SITE), parseFloat(resiliation.LONGITUDE_SITE)]}>
                  <Popup>
                    <strong>#{resiliation.crm_case}</strong><br />
                    {resiliation.CLIENT}<br />
                    {resiliation.Gouvernorat}, {resiliation.Delegation}<br />
                    <small>{resiliation.STATUT}</small>
                  </Popup>
                </Marker>
              )
            ))}
          </MapContainer>
        </div>
      )}
      <div className="activation-list">
        {resiliations.map((resiliation) => (
          <div
            key={resiliation.crm_case}
            className={`activation-card ${selectedResiliations.some(a => a.crm_case === resiliation.crm_case) ? 'selected' : ''}`}
            onClick={() => handleRowClick(resiliation)}

         >
            <div className="activation-select">
              {resiliation.STATUT === 'En cours' && (
                <input
                  type="checkbox"
                  checked={selectedResiliations.some(a => a.crm_case === resiliation.crm_case)}
                  onChange={(e) => handlePlainteSelect(resiliation, e)}
                  onClick={(e) => e.stopPropagation()}
                />
              )}
            </div>

            <div className="activation-main">
              <span className="crm-case">#{resiliation.crm_case}</span>
              <h3>{resiliation.CLIENT}</h3>
              <div className="activation-meta">
                <span className="gouvernorat">
                  <FiMapPin /> {resiliation.Gouvernorat}
                </span>
                <span className="delegation">{resiliation.Delegation}</span>
                <span className="msisdn">
                  <FiPhone /> {resiliation.MSISDN}
                </span>
              </div>
            </div>

            <div className="activation-status">
              <span className={`status-badge ${resiliation.STATUT.toLowerCase().replace(" ", "-")}`}>
                {resiliation.STATUT}
              </span>
              <span className="sla">
                <FiClock /> {resiliation.SLA_STT?.toFixed(2) || 'N/A'}h
              </span>
            </div>

            <FiChevronRight className="chevron-icon" />
          </div>
        ))}
      </div>
      
      {showTechnicianSelect && selectedResiliations.length > 0 && (
        <div className="technician-select-modal">
          <div className="technician-select-content">
            <div className="modal-header">
              <h3>Assigner un technicien</h3>
              <button className="close-modal" onClick={() => setShowTechnicianSelect(false)}>×</button>
            </div>
            <div className="selection-info">
              <p><strong>{selectedResiliations.length}</strong> resiliation(s) sélectionnée(s)</p>
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
              <button className="cancel-btn" onClick={() => setShowTechnicianSelect(false)}>Annuler</button>
              <button className="confirm-btn" onClick={handleAssignTechnician} disabled={!selectedTechnician}>Confirmer</button>
            </div>
          </div>
        </div>
      )}
      {showDetails && selectedTask && (
        <div className="modal-overlayC" onClick={() => setShowDetails(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setShowDetails(false)}>×</button>
            <div className="modal-header">
              <h2>#{selectedTask.crm_case} - {selectedTask.CLIENT}</h2>
              <span className={`status-badge large ${selectedTask.STATUT.toLowerCase().replace(" ", "-")}`}>{selectedTask.STATUT}</span>
            </div>
          </div>
        </div>
      )}
      {resiliations.length > 0 && (
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
      {showDetails && selectedTask && (
  <div className="modal-overlay" onClick={() => setShowDetails(false)}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      <button className="close-modal" onClick={() => setShowDetails(false)}>
        ×
      </button>
      {renderComplaintDetails()}
    </div>
  </div>
)}
    </div>
  );
};

export default Resiliations;