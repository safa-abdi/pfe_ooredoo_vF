import React, { useEffect, useState } from "react";
import axios from "axios";
import useUserData from "../hooks/useUserData";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
// Icons
import {
  FiAlertTriangle,
  FiCalendar,
  FiPhone,
  FiMapPin,
  FiInfo,
  FiChevronRight,
  FiClock,
  FiTool,
  FiXCircle,
  FiUser,
  FiCheck,
  FiMap,
  FiX,
  FiSearch,
  FiFilter
} from "react-icons/fi";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});


const Complaints = ({ companyId, filters }) => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPlaintes, setSelectedPlaintes] = useState([]);
  const [showMap, setShowMap] = useState(false);
  const [technicians, setTechnicians] = useState({});
  const [selectedTechnician, setSelectedTechnician] = useState(null);
  const [showTechnicianSelect, setShowTechnicianSelect] = useState(false);
  const [selectedGovernorate, setSelectedGovernorate] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [technicianStatusCounts, setTechnicianStatusCounts] = useState({});

  const { user } = useUserData();

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
            <p><strong>Type plainte:</strong> {selectedTask.TYPE_PLAINTE || '-'}</p>
          </div>

          <div className="details-section">
            <h3><FiMapPin /> Localisation</h3>
            <p><strong>Gouvernorat:</strong> {selectedTask.Gouvernorat}</p>
            <p><strong>Délégation:</strong> {selectedTask.Delegation}</p>
            <p><strong>CGPS:</strong> {selectedTask.LONGITUDE_SITE || '-'} , {selectedTask.LATITUDE_SITE || '-'}</p>
          </div>

          <div className="details-section">
            <h3><FiTool /> Détails plainte</h3>
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
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });

  const handleAssignTechnician = async () => {
    if (selectedPlaintes.length === 0 || !selectedTechnician) return;

    const params = {
      plainteIds: selectedPlaintes.map(p => p.crm_case),
      technicianId: selectedTechnician.id,
      companyId: user.company.id,
    };

    try {
      const response = await axios.put(`http://localhost:3000/plainte/assign-delegation`, params);
      console.log("Plaintes assignées:", response.data);
      setSelectedPlaintes([]);
      setSelectedTechnician(null);
      setShowTechnicianSelect(false);
      alert("Affectation réussie !");
    } catch (error) {
      console.error("Erreur lors de l'affectation :", error);
      alert("Erreur lors de l'affectation des plaintes.");
    }
  };
  const fetchTechnicians = async () => {
    try {
      console.log("compId k",user.company.id)
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

      if (!techniciansForGov || techniciansForGov.length === 0) {
        console.warn(`Aucun technicien trouvé pour le gouvernorat: ${governorate}`);
        setTechnicianStatusCounts({});
        return;
      }

      const counts = {};

      await Promise.all(
        techniciansForGov.map(async (tech) => {
          try {
            const response = await axios.get(`http://localhost:3000/plainte/count-by-status-tech`, {
              params: {
                technicianId: tech.id,
                Gouv: govKey,
                sttId: user.company.id,
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
    fetchTechnicianStatusCounts(normalizedGov, user.company.id);
  };
 useEffect(() => {
  fetchTechnicians();
  fetchComplaints();
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
        `http://localhost:3000/plainte/company/${companyId}`,
        { params }
      );

      setComplaints(response.data.data);
      setPagination(prev => ({
        ...prev,
        total: response.data.total,
      }));
    } catch (err) {
      setError("Erreur lors du chargement des plaintes");
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

  const handlePlainteSelect = (plainte, e) => {
    e.stopPropagation();
    setSelectedPlaintes(prev => {
      const isSelected = prev.some(a => a.crm_case === plainte.crm_case);
      if (isSelected) {
        return prev.filter(a => a.crm_case !== plainte.crm_case);
      } else {
        return [...prev, plainte];
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
        {selectedPlaintes.length > 0 && (
          <>
            <button className="show-map-btn" onClick={() => setShowMap(!showMap)}>
              <FiMap /> {showMap ? 'Masquer la carte' : 'Afficher sur la carte'}
            </button>
            <button
              className="assign-btn"
              onClick={() => {
                const governorateToUse = selectedPlaintes[0]?.Gouvernorat?.toLowerCase() || "";
                if (governorateToUse) {
                  setSelectedGovernorate(governorateToUse);
                  fetchTechniciansForGovernorate(governorateToUse);
                  setShowTechnicianSelect(true);
                } else {
                  alert("Veuillez sélectionner une plainte avec un gouvernorat valide.");
                }
              }}
            >
              <FiUser /> Assigner un technicien
            </button>
            <span className="selected-count">
              {selectedPlaintes.length} sélectionné(s)
            </span>
            <button className="clear-selection" onClick={() => setSelectedPlaintes([])}>
              <FiX /> Annuler
            </button>
          </>
        )}
      </div>
      {showMap && selectedPlaintes.length > 0 && (
        <div className="map-container">
          <MapContainer center={[34, 9]} zoom={6} style={{ height: '400px', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {selectedPlaintes.map(plainte => (
              plainte.LATITUDE_SITE && plainte.LONGITUDE_SITE && (
                <Marker key={plainte.crm_case}
                  position={[parseFloat(plainte.LATITUDE_SITE), parseFloat(plainte.LONGITUDE_SITE)]}>
                  <Popup>
                    <strong>#{plainte.crm_case}</strong><br />
                    {plainte.CLIENT}<br />
                    {plainte.Gouvernorat}, {plainte.Delegation}<br />
                    <small>{plainte.STATUT}</small>
                  </Popup>
                </Marker>
              )
            ))}
          </MapContainer>
        </div>
      )}
      <div className="activation-list">
        {complaints.map((plainte) => (
          <div
            key={plainte.crm_case}
            className={`activation-card ${selectedPlaintes.some(a => a.crm_case === plainte.crm_case) ? 'selected' : ''}`}
            onClick={() => handleRowClick(plainte)}

          >
            <div className="activation-select">
              {plainte.STATUT === 'En cours' && (
                <input
                  type="checkbox"
                  checked={selectedPlaintes.some(a => a.crm_case === plainte.crm_case)}
                  onChange={(e) => handlePlainteSelect(plainte, e)}
                  onClick={(e) => e.stopPropagation()}
                />
              )}
            </div>

            <div className="activation-main">
              <span className="crm-case">#{plainte.crm_case}</span>
              <h3>{plainte.CLIENT}</h3>
              <div className="activation-meta">
                <span className="gouvernorat">
                  <FiMapPin /> {plainte.Gouvernorat}
                </span>
                <span className="delegation">{plainte.Delegation}</span>
                <span className="msisdn">
                  <FiPhone /> {plainte.MSISDN}
                </span>
              </div>
            </div>

            <div className="activation-status">
              <span className={`status-badge ${plainte.STATUT.toLowerCase().replace(" ", "-")}`}>
                {plainte.STATUT}
              </span>
              <span className="sla">
                <FiClock /> {plainte.SLA_STT?.toFixed(2) || 'N/A'}h
              </span>
            </div>

            <FiChevronRight className="chevron-icon" />
          </div>
        ))}
      </div>

      {showTechnicianSelect && selectedPlaintes.length > 0 && (
        <div className="technician-select-modal">
          <div className="technician-select-content">
            <div className="modal-header">
              <h3>Assigner un technicien "Plainte"</h3>
              <button className="close-modal" onClick={() => setShowTechnicianSelect(false)}>×</button>
            </div>
            <div className="selection-info">
              <p><strong>{selectedPlaintes.length}</strong> plainte(s) sélectionnée(s)</p>
              <p>Gouvernorat: <strong>{selectedGovernorate || "Non spécifié"}</strong></p>
            </div>
            <div className="technician-filters">
              <label>Gouvernorat:</label>
              <select
                value={selectedGovernorate}
                onChange={(e) => {
                  const gov = e.target.value.toLowerCase();
                  setSelectedGovernorate(gov);
                  setSelectedTechnician(null);
                  fetchTechniciansForGovernorate(gov);
                }}
              >
                <option value="">Sélectionner un gouvernorat</option>
                {Object.keys(technicians).map(gov => (
                  <option key={gov} value={gov}>{gov.charAt(0).toUpperCase() + gov.slice(1)}</option>
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
          <div className="modal-contentSTTP" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setShowDetails(false)}>×</button>
            <div className="modal-header">
              <h2>#{selectedTask.crm_case} - {selectedTask.CLIENT}</h2>
              <span className={`status-badge large ${selectedTask.STATUT.toLowerCase().replace(" ", "-")}`}>{selectedTask.STATUT}</span>
            </div>
          </div>
        </div>
      )}
      {complaints.length > 0 && (
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
          <div className="modal-contentSTTP" onClick={(e) => e.stopPropagation()}>
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

export default Complaints;