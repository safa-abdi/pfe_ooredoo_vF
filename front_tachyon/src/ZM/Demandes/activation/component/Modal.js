// src/components/Modal/Modal.js
import React from 'react';
import './Modal.css'; // Fichier CSS pour le style de la modal

const Modal = ({ isOpen, onClose, children }) => {
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

export default Modal;