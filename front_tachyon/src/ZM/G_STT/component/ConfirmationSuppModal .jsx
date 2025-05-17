import React from 'react';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, message }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlaySupp">
            <div className="modal-contentSupp">
                <p>{message}</p>
                <div className="modal-actionsSupp">
                    <button onClick={onClose} className="btn-cancel">Annuler</button>
                    <button onClick={onConfirm} className="btn-confirm">Confirmer</button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;