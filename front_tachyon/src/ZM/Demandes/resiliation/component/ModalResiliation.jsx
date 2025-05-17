// src/components/Modal/Modal.js
import React from 'react';
import '../styles/ModalResiliation.css';

const ModalResiliation = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay5">
      <div className="modal-content5">
        <button className="modal-close" onClick={onClose}>
          &times;
        </button>
        {children}
      </div>
    </div>
  );
};

export default ModalResiliation;