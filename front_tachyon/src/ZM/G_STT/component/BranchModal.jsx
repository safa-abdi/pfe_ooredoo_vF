import React, { useState } from 'react';
import axios from 'axios';
import { FaTimes } from 'react-icons/fa';
import './BranchModal.css'
const BranchModal = ({
  isOpen,
  onClose,
  branches,
  selectedSTT,
  subcontractors,
  fetchSubcontractors,
  fetchBranches,
  fetchAllBranches,
}) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [targetGovernorate, setTargetGovernorate] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  if (!isOpen) return null;

  const selectedSubcontractor = subcontractors.find(sub => sub.id === selectedSTT);
  const isGroupedByGovernorate = branches && branches.governorates;

  const handleConfirmAction = async () => {
    try {
      if (!targetGovernorate) {
        throw new Error('Aucun gouvernorat sélectionné');
      }

      const endpoint = `http://localhost:3000/branches/block-governorate`;
      const response = await axios.put(endpoint, {
        governorate: targetGovernorate,
        companyId: selectedSTT,
        action: actionType
      });

      setSuccessMessage(
        `Gouvernorat ${targetGovernorate} ${actionType === 'block' ? 'bloqué' : 'débloqué'} avec succès`
      );

      // Refresh data
      await Promise.all([
        fetchBranches(selectedSTT),
        fetchAllBranches(),
        fetchSubcontractors()
      ]);

    } catch (error) {
      console.error("Action failed:", error);
      setSuccessMessage(
        error.response?.data?.message ||
        `Erreur lors de ${actionType === 'block' ? 'blocage' : 'déblocage'} du gouvernorat`
      );
    } finally {
      setShowConfirmation(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleCancelAction = () => {
    setShowConfirmation(false);
    setActionType(null);
    setTargetGovernorate(null);
  };

  const triggerGovernorateAction = (type, governorate) => {
    setActionType(type);
    setTargetGovernorate(governorate);
    setShowConfirmation(true);
  };

  return (
    <div className="modal-overlay-listB">
      <div className="modal-content-listB">
        <button className="close-btn8" onClick={onClose}>
          <FaTimes />
        </button>
        <h2>{selectedSubcontractor?.name}</h2>

        {successMessage && (
          <div className={`alert ${successMessage.includes('Erreur') ? 'alert-error' : 'alert-success'}`}>
            {successMessage}
          </div>
        )}

        {isGroupedByGovernorate ? (
          <div className="governorate-container">
            {Object.entries(branches.governorates).map(([governorate, { technicians, isBlocked }]) => (
              <div key={governorate} className="governorate-section">
                <div className="governorate-header">
                  <h3 className="governorate-title">{governorate}</h3>
                  <div className="governorate-actions">
                    <button
                      className={`btn ${isBlocked ? 'btn-unblock' : 'btn-block'}`}
                      onClick={() => triggerGovernorateAction(
                        isBlocked ? 'unblock' : 'block',
                        governorate
                      )}
                    >
                      {isBlocked ? 'Débloquer le gouvernorat' : 'Bloquer le gouvernorat'}
                    </button>
                    <span className={`status-badge ${isBlocked ? 'blocked' : 'active'}`}>
                      {isBlocked ? 'Bloqué' : 'Actif'}
                    </span>
                  </div>
                </div>

                <div className="technicians-list">
                  <h4>Techniciens affectés :</h4>
                  {technicians.length > 0 ? (
                    <ul>
                      {technicians.map(tech => (
                        <li key={tech.id} className="technician-item">
                          <div className="technician-info">
                            <span className="technician-name">{tech.nom} {tech.prénom}</span>&nbsp;&nbsp;
                            <span className="technician-email">{tech.email}</span>&nbsp;&nbsp;
                            <span className="technician-phone">{tech.num_tel || 'Téléphone non disponible'}</span>
                            <span
                              className={`availability-indicator ${tech.disponibilité ? 'available' : 'unavailable'
                                }`}
                              title={tech.disponibilité ? 'Technicien disponible' : 'Technicien indisponible'}
                            >
                              {tech.disponibilité ? '✔' : '✖'}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="no-technicians">Aucun technicien affecté à ce gouvernorat</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-branches-message">
            <p>Aucune délégation trouvée pour cette entreprise</p>
            <button
              className="btn-block-company"
              onClick={() => triggerGovernorateAction(
                selectedSubcontractor.blocked ? 'unblock' : 'block',
                null
              )}
            >
              {selectedSubcontractor?.blocked ? 'Débloquer l\'entreprise' : 'Bloquer l\'entreprise'}
            </button>
          </div>
        )}

        {showConfirmation && (
          <div className="confirmation-modal">
            <div className="confirmation-content">
              <h3>Confirmation</h3>
              <p>
                Êtes-vous sûr de vouloir {actionType === 'block' ? 'bloquer' : 'débloquer'} le gouvernorat{' '}
                <strong>{targetGovernorate}</strong> ?
              </p>
              <div className="confirmation-buttons">
                <button className="btn-confirm" onClick={handleConfirmAction}>
                  Confirmer
                </button>
                <button className="btn-cancel" onClick={handleCancelAction}>
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BranchModal;