import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EditCompanyModal = ({ isOpen, onClose, company, onCompanyUpdated }) => {
    const [name, setName] = useState('');
    const [adresse, setAdresse] = useState('');
    const [contact, setContact] = useState('');
    const [error, setError] = useState(null);

    // Mise à jour des valeurs dès que `company` change
    useEffect(() => {
        if (company) {
            setName(company.name);
            setAdresse(company.adresse);
            setContact(company.contact);
        }
    }, [company]);  // Réexécuter l'effet lorsque `company` change

    const handleSubmit = async (e) => {
        e.preventDefault();

        const updatedCompany = {
            name,
            adresse,
            contact,
        };

        try {
            // Envoi des données mises à jour à l'API
            const response = await axios.put(`http://localhost:3000/companies/${company.id}`, updatedCompany);
            
            // Appel de la fonction onCompanyUpdated avec les données mises à jour
            onCompanyUpdated(response.data);

            // Ferme le modal après mise à jour
            onClose();
        } catch (err) {
            setError("Erreur lors de la mise à jour de l'entreprise");
            console.error("Erreur lors de la mise à jour:", err);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay10">
            <div className="modal-content10">
                <h2>Modifier l'entreprise</h2>
                <form onSubmit={handleSubmit}>
                    <label>
                        Nom
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </label>
                    <label>
                        Adresse
                        <input
                            type="text"
                            value={adresse}
                            onChange={(e) => setAdresse(e.target.value)}
                        />
                    </label>
                    <label>
                        Contact
                        <input
                            type="text"
                            value={contact}
                            onChange={(e) => setContact(e.target.value)}
                        />
                    </label>
                    {error && <p style={{ color: 'red' }}>{error}</p>}
                    <button type="submit">Enregistrer</button>
                    <button type="button" onClick={onClose}>Annuler</button>
                </form>
            </div>
        </div>
    );
};

export default EditCompanyModal;
