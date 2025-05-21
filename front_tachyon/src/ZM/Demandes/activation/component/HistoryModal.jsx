import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

const HistoryModal = ({ historyData, onClose }) => {
  return (
    <div className="modal-overlayHistory">
      <div className="history-modal">
        <div className="modal-header">
          <h3>Historique de la demande</h3>
          <button onClick={onClose} className="close-button">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        
        <div className="history-content">
          <h4>Actions</h4>
          <div className="history-list">
            {historyData.caseHistory.map((item) => (
              <div key={item.id} className="history-item">
                <div className="history-date">
                  {new Date(item.actionDate).toLocaleString('fr-FR')}
                </div>
                <div className="history-action">
                  <strong>{item.action}</strong> par {item.user_name}
                  {item.STT && <span> (STT: {item.STT})</span>}
                </div>
              </div>
            ))}
          </div>
          
          <h4>Demandes associées</h4>
          <div className="demandes-section">
            <div className="demande-type">
              <h5>Activation</h5>
              {historyData.demandesHistory.activations.map((act) => (
                <div key={act.crm_case} className="demande-item">
                  <div>CRM Case: {act.crm_case}</div>
                  <div>Statut: {act.STATUT}</div>
                  <div>Date création: {new Date(act.DATE_CREATION_CRM).toLocaleString('fr-FR')}</div>
                </div>
              ))}
            </div>
            
            <div className="demande-type">
              <h5>Plaintes</h5>
              {historyData.demandesHistory.plaintes.map((plainte) => (
                <div key={plainte.crm_case} className="demande-item">
                  <div>CRM Case: {plainte.crm_case}</div>
                  <div>Statut: {plainte.STATUT}</div>
                  <div>Date création: {new Date(plainte.DATE_CREATION_CRM).toLocaleString('fr-FR')}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;