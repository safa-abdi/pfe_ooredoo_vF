import React from 'react';

const RDVModal = ({
  show,
  onClose,
  onConfirm,
  movement,
  dateValue,
  setDateValue,
  pdfFile,
  setPdfFile,
}) => {
  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Planifier RDV pour {movement?.product?.name}</h3>
        
        <div className="form-group">
          <label>Date de RDV:</label>
          <input
            type="datetime-local"
            value={dateValue}
            onChange={(e) => setDateValue(e.target.value)}
          />
        </div>
        
        <div className="form-group">
          <label>Fichier PDF:</label>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setPdfFile(e.target.files[0])}
          />
        </div>
        
        <div className="modal-actions">
          <button onClick={onClose} className="cancel-btn">
            Annuler
          </button>
          <button 
            onClick={onConfirm} 
            className="confirm-btn"
            disabled={!pdfFile}
          >
            Confirmer et envoyer
          </button>
        </div>
      </div>
    </div>
  );
};

export default RDVModal;