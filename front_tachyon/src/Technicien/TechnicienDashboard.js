import React, { useEffect, useState } from "react";
import Navbar from "../STT/components/navbar/Navbar";
import Sidebar from "../STT/components/navbar/Sidebar";
import 'leaflet/dist/leaflet.css';
import useUserData from "../STT/components/hooks/useUserData";
import { FaEdit, FaTrash, FaPlus, FaSearch, FaSync, FaChevronRight, FaChevronLeft } from "react-icons/fa";
import './TechnicienDashboard.css';
import Modal from 'react-modal';

Modal.setAppElement('#root');

const TechnicienDashboard = () => {
  const { user } = useUserData();
  const [techniciens, setTechniciens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTech, setCurrentTech] = useState(null);
  const [coordinateurs, setCoordinateurs] = useState([]);
  const [roles, setRoles] = useState([]);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });
  // Form state
  const [formData, setFormData] = useState({
    nom: '',
    prénom: '',
    num_tel: '',
    email: '',
    date_naiss: '',
    disponibilité: 'présent',
    password: '',
    role_id: 2,
    coordinateur_id: ''
  });

  const getStatusText = (statusValue) => {
    if (typeof statusValue === 'boolean') {
      return statusValue ? "présent" : "Absent";
    }
    const statusMap = {
      1: "présent",
      0: "Absent"
    };
    return statusMap[statusValue] || "Inconnu";
  };

  const getStatusValue = (statusText) => {
    const statusMap = {
      "présent": true,
      "Absent": false,
    };
    return statusMap[statusText] ?? true;
  };

  useEffect(() => {
    fetchTechniciens();
    fetchCordinators();
    fetchRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, pagination.page, pagination.limit]);

  const fetchTechniciens = () => {
    if (user && user.company && user.company.id) {
      setLoading(true);
      fetch(`http://localhost:3000/users/by-company/${user.company.id}?page=${pagination.page}&limit=${pagination.limit}`)
        .then((res) => {
          if (!res.ok) throw new Error('Network response was not ok');
          return res.json();
        })
        .then((data) => {
          setTechniciens(data.data || data);
          setPagination(prev => ({
            ...prev,
            total: data.total || data.length,
            totalPages: Math.ceil((data.total || data.length) / pagination.limit)
          }));
          setLoading(false);
        })
        .catch((err) => {
          console.error("Erreur lors de la récupération des techniciens:", err);
          setError(err.message);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  };
  const fetchCordinators = () => {
    if (user && user.company && user.company.id) {
      setLoading(true);
      fetch(`http://localhost:3000/users/company/${user.company.id}/coordinateurs`)
        .then((res) => {
          if (!res.ok) throw new Error('Network response was not ok');
          return res.json();
        })
        .then((data) => {
          setCoordinateurs(data.data || data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Erreur lors de la récupération des cordinateurs:", err);
          setError(err.message);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  };
  const fetchRoles = () => {
    if (user && user.company && user.company.id) {
      setLoading(true);
      fetch(`http://localhost:3000/users/roles`)
        .then((res) => {
          if (!res.ok) throw new Error('Network response was not ok');
          return res.json();
        })
        .then((data) => {
          setRoles(data.data || data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Erreur lors de la récupération des roles:", err);
          setError(err.message);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  };
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const filteredTechniciens = techniciens.filter(tech =>
    `${tech.nom} ${tech.prénom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tech.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tech.num_tel.includes(searchTerm)
  );

  const openAddModal = () => {
    setCurrentTech(null);
    setFormData({
      nom: '',
      prénom: '',
      num_tel: '',
      email: '',
      date_naiss: '',
      disponibilité: 1,
      password: '',
      role_id: 2
    });
    setIsModalOpen(true);
  };

  const openEditModal = (tech) => {
    setCurrentTech(tech);
    setFormData({
      nom: tech.nom,
      prénom: tech.prénom,
      num_tel: tech.num_tel,
      email: tech.email,
      date_naiss: tech.date_naiss.split('T')[0],
      disponibilité: getStatusText(tech.disponibilité),
      password: '',
      role_id: tech.role.id,
      coordinateur_id: tech.coordinateur?.id || ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const url = currentTech
      ? `http://localhost:3000/users/${currentTech.id}`
      : 'http://localhost:3000/users';

    const method = currentTech ? 'PATCH' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          disponibilité: getStatusValue(formData.disponibilité),
          company_id: user.company.id
        })
      });

      if (!response.ok) throw new Error('Erreur lors de la sauvegarde');

      fetchTechniciens();
      closeModal();
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce technicien ?')) return;

    try {
      const response = await fetch(`http://localhost:3000/users/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Erreur lors de la suppression');

      fetchTechniciens();
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    }
  };

  if (loading) {
    return (
      <div className="dashboardTech-container">
        <div className="loading-spinner">
          <FaSync className="spinner-icon" />
          <span>Chargement en cours...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboardTech-container">
        <div className="error-message">
          Erreur: {error}
          <button onClick={fetchTechniciens} className="refresh-button">
            <FaSync /> Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!user || !user.company) {
    return (
      <div className="dashboardTech-container">
        <div className="no-company-message">
          Aucune information d'entreprise présent.
        </div>
      </div>
    );
  }

  return (
    <div className="dashboardTech-container">
      <Navbar />
      <Sidebar />
      <div className="mainTech-content">
        <div className="header-section">
        </div>

        <div className="search-section">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Rechercher un technicien..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          <div className="actions">
            <button onClick={openAddModal} className="add-button">
              <FaPlus /> Ajouter un technicien
            </button>
          </div>
        </div>

        <div className="technician-list-container">
          {loading ? (
            <div className="loading-spinner">
              <FaSync className="spinner-icon" />
              <span>Chargement en cours...</span>
            </div>
          ) : error ? (
            <div className="error-message">
              Erreur: {error}
              <button onClick={fetchTechniciens} className="refresh-button">
                <FaSync /> Réessayer
              </button>
            </div>
          ) : techniciens.length === 0 ? (
            <div className="empty-state">
              <p>Aucun technicien trouvé.</p>
              <button onClick={openAddModal} className="add-button">
                <FaPlus /> Ajouter votre premier technicien
              </button>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="technician-table">
                  <thead>
                    <tr>
                      <th>Nom complet</th>
                      <th>Téléphone</th>
                      <th>Email</th>
                      <th>Date naissance</th>
                      <th>Disponibilité</th>
                      <th>Rôle</th>
                      <th>Coordinateur</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTechniciens.map((tech) => (
                      <tr key={tech.id}>
                        <td>
                          <div className="user-info">
                            <div className="avatar-placeholder">
                              {tech.nom.charAt(0)}{tech.prénom.charAt(0)}
                            </div>
                            <span>{tech.nom.toUpperCase()} {tech.prénom.charAt(0).toUpperCase() + tech.prénom.slice(1).toLowerCase()}</span>
                            </div>
                        </td>
                        <td>{tech.num_tel}</td>
                        <td>{tech.email}</td>
                        <td>{new Date(tech.date_naiss).toLocaleDateString()}</td>
                        <td>
                          <td>
                            <span className={`status-badge ${tech.disponibilité ? 'available' : 'busy'}`}>
                              {getStatusText(tech.disponibilité)}
                            </span>
                          </td>
                        </td>
                        <td>{tech.role.name}</td>
                        <td>{tech.coordinateur ? `${tech.coordinateur.nom ?? ''} ${tech.coordinateur.prénom ?? ''}` : ''}</td>
                        <td>
                          <div className="action-buttons">
                            <button onClick={() => openEditModal(tech)} className="edit-button">
                              <FaEdit />
                            </button>
                            <button onClick={() => handleDelete(tech.id)} className="delete-button">
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              <div className="pagination-controls">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="pagination-button"
                >
                  <FaChevronLeft />
                </button>

                <span className="page-info">
                  Page {pagination.page} sur {pagination.totalPages}
                </span>

                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="pagination-button"
                >
                  <FaChevronRight />
                </button>

                <select
                  value={pagination.limit}
                  onChange={(e) => setPagination(prev => ({
                    ...prev,
                    limit: Number(e.target.value),
                    page: 1
                  }))}
                  className="limit-select"
                >
                  <option value="5">5 par page</option>
                  <option value="10">10 par page</option>
                  <option value="20">20 par page</option>
                  <option value="50">50 par page</option>
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal pour ajouter/modifier */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        className="tech-modal"
        overlayClassName="modal-overlayGtech"
      >
        <h2>{currentTech ? 'Modifier Technicien' : 'Ajouter Technicien'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Nom</label>
              <input
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Prénom</label>
              <input
                type="text"
                name="prénom"
                value={formData.prénom}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Téléphone</label>
              <input
                type="tel"
                name="num_tel"
                value={formData.num_tel}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Disponibilité</label>
              <select
                name="disponibilité"
                value={formData.disponibilité}
                onChange={handleInputChange}
                required
              >
                <option value="présent">présent</option>
                <option value="Absent">Absent</option>
              </select>
            </div>
            <div className="form-group">
              <label>Date de naissance</label>
              <input
                type="date"
                name="date_naiss"
                value={formData.date_naiss}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
          <div className="form-row">
          <div className="form-group">
                <label>Coordinateur</label>
                <select
                  name="coordinateur_id"
                  value={formData.coordinateur_id || ''}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">-- Sélectionner un coordinateur --</option>
                  {coordinateurs.map((coord) => (
                    <option key={coord.id} value={coord.id}>
                      {coord.nom} {coord.prénom}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  name="role_id"
                  value={formData.role_id || ''}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">-- Sélectionner un role --</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
          </div>
          {!currentTech && (
            <div className="form-group">
              <label>Mot de passe</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required={!currentTech}
                minLength="6"
              />
            </div>
          )}

          <div className="modal-actionsGtech">
            <button type="button" onClick={closeModal} className="cancel-buttonTechG">
              Annuler
            </button>
            <button type="submit" className="submit-buttonG_tech">
              {currentTech ? 'Mettre à jour' : 'Ajouter'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TechnicienDashboard;