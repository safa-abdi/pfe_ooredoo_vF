import React, { useState } from 'react';

const ConfirmationModal = ({ 
  show, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  showDateInput, 
  dateValue, 
  setDateValue,
  selectedGroup,
  confirmText = "Confirmer",
  loading
}) => {
  const [dateError, setDateError] = useState('');

  if (!show) return null;

  // Calcul de la date minimale autorisée
  const getMinDate = () => {
    if (!selectedGroup?.movements) return new Date(); // Aujourd'hui par défaut
    
    const rdvDates = selectedGroup.movements
      .filter(m => m.date_rdv)
      .map(m => new Date(m.date_rdv));
    
    return rdvDates.length > 0 ? new Date(Math.max(...rdvDates)) : new Date();
  };

  const minDate = getMinDate();
  const minDateString = minDate.toISOString().split('T')[0];

  const handleConfirm = () => {
    // Validation finale avant confirmation
    const selectedDate = new Date(dateValue);
    if (selectedDate < minDate) {
      setDateError(`La date doit être ≥ ${minDate.toLocaleDateString('fr-FR')}`);
      return;
    }
    onConfirm();
  };

  return (
    <div className="modal-overlay">
      <div className="confirmation-modal">
        <h3>{title}</h3>
        <p>{message}</p>
        
        {showDateInput && (
          <div className="date-input-group">
            <label>
              Date de prélèvement:
              <input
                type="date"
                value={dateValue}
                min={minDateString}
                onChange={(e) => {
                  setDateValue(e.target.value);
                  setDateError(''); // Reset l'erreur quand on modifie
                }}
                className="form-control"
              />
            </label>
            {dateError && (
              <div className="alert alert-danger mt-2">{dateError}</div>
            )}
            <div className="text-muted mt-1">
              Date minimale: {minDate.toLocaleDateString('fr-FR')}
            </div>
          </div>
        )}

        <div className="modal-footer">
          <button 
            onClick={onClose} 
            className="btn btn-secondary"
            disabled={loading}
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            className="btn btn-primary"
            disabled={loading || (showDateInput && dateError)}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Validation...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;