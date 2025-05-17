import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import axios from 'axios';

const AddCompanyModal = ({ isOpen, onClose, onCompanyAdded }) => {
    const [name, setName] = useState('');
    const [adresse, setAdresse] = useState('');
    const [contact, setContact] = useState('');
    const [errors, setErrors] = useState({ name: '', adresse: '', contact: '' });
    const [successMessage, setSuccessMessage] = useState('');
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);

    const handleContactChange = (e) => {
        const value = e.target.value;
        if (/^\d{0,8}$/.test(value)) {
            setContact(value);
            setErrors({ ...errors, contact: value.length === 8 ? '' : 'Le contact doit contenir exactement 8 chiffres.' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        let newErrors = {};
        if (!name) newErrors.name = "Le nom de l'entreprise est requis.";
        if (!adresse) newErrors.adresse = "L'adresse est requise.";
        if (contact.length !== 8) newErrors.contact = "Le contact doit contenir exactement 8 chiffres.";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            const response = await axios.post('http://localhost:3000/companies', {
                name,
                adresse,
                contact
            });

            setName('');
            setAdresse('');
            setContact('');
            setErrors({});
            setSuccessMessage("STT ajoutée avec succès !");
            setShowSuccessPopup(true);

            onCompanyAdded(response.data);

            // Masquer le popup après 1 seconde
            setTimeout(() => {
                setShowSuccessPopup(false);
                onClose();
            }, 1000);

        } catch (error) {
            console.error("Erreur lors de l'ajout de l'entreprise", error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="close-btn" onClick={onClose}>
                    <FaTimes />
                </button>
                <h2>Ajouter une entreprise</h2>
                <h3>&nbsp;</h3>

                {showSuccessPopup && (
                    <div className="success-popup">
                        {successMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Nom de STT</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        {errors.name && <p className="error-text">{errors.name}</p>}
                    </div>
                    <div className="form-group">
                        <label>Adresse</label>
                        <input
                            type="text"
                            value={adresse}
                            onChange={(e) => setAdresse(e.target.value)}
                        />
                        {errors.adresse && <p className="error-text">{errors.adresse}</p>}
                    </div>
                    <div className="form-group">
                        <label>Numéro téléphone</label>
                        <input
                            type="text"
                            value={contact}
                            onChange={handleContactChange}
                        />
                        {errors.contact && <p className="error-text">{errors.contact}</p>}
                    </div>
                    <button type="submit" className="submit-btn2">
                        Ajouter
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddCompanyModal;
