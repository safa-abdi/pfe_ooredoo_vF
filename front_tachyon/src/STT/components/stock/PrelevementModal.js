import React, { useState } from 'react';

const PrelevementModal = ({
    show,
    onClose,
    onConfirm,
    title,
    message,
    loading,
    error,
  }) => {
  const [datePrelev, setDatePrelev] = useState('');
  const [pdfFile, setPdfFile] = useState(null);

  const handleFileChange = (e) => {
    setPdfFile(e.target.files[0]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!datePrelev) {
      // eslint-disable-next-line no-undef
      setApiError("Veuillez saisir une date de prélèvement");
      return;
    }
    onConfirm(datePrelev, pdfFile);
  };

  return (
    <div className={`modal ${show ? 'show' : ''}`}>
      <div className="modal-content">
        <div className="modal-header">
          <h3>{title}</h3>
          <button onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <p>{message}</p>
          
          <div className="form-group">
            <label>Date de prélèvement:</label>
            <input
              type="datetime-local"
              value={datePrelev}
              onChange={(e) => setDatePrelev(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Fichier PDF (optionnel):</label>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
        </div>
        <div className="modal-footer">
          <button onClick={onClose} disabled={loading}>
            Annuler
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={loading || !datePrelev}
            className="btn-confirm"
          >
            {loading ? 'En cours...' : 'Confirmer'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrelevementModal;