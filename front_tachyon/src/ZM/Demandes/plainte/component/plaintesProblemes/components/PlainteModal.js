import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMap, faEdit, faSpinner, faTimes, faSave, faUndo } from '@fortawesome/free-solid-svg-icons';
import '../style/plainteModal.css'
const PlainteModal = ({
    isOpen,
    onClose,
    selectedPlainte,
    editMode,
    setEditMode,
    formData,
    setFormData,
    onSaveSuccess
}) => {
    const [successMessage, setSuccessMessage] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);

    if (!isOpen || !selectedPlainte) return null;

    const GOUVERNORATS = [{ id: '24', name: 'Zaghouan' }, { id: '23', name: 'Tunis' }, { id: '22', name: 'Tozeur' }, { id: '21', name: 'Tataouine' },
    { id: '20', name: 'Sousse' }, { id: '19', name: 'Siliana' }, { id: '18', name: 'Sidi Bouzid' }, { id: '17', name: 'Sfax' }, { id: '16', name: 'Nabeul' }, { id: '15', name: 'Monastir' },
    { id: '14', name: 'Medenine' }, { id: '13', name: 'Manouba' }, { id: '12', name: 'Mahdia' }, { id: '11', name: 'Le Kef' },
    { id: '10', name: 'Kébili' }, { id: '9', name: 'Kasserine' }, { id: '8', name: 'Kairouan' }, { id: '7', name: 'Jendouba' },
    { id: '6', name: 'Gafsa' }, { id: '5', name: 'Gabes' }, { id: '4', name: 'Bizerte' }, { id: '3', name: 'Ben Arous' }, { id: '2', name: 'Beja' },
    { id: '1', name: 'Ariana' }
    ];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };
    const handleSaveChanges = async () => {
        setIsSaving(true);
        try {
            const dataToSend = {
                ...formData,
                LONGITUDE_SITE: parseFloat(formData.LONGITUDE_SITE) || 0,
                LATITUDE_SITE: parseFloat(formData.LATITUDE_SITE) || 0,
                crm_case: selectedPlainte.crm_case
            };

            const response = await fetch('http://localhost:3000/plainte', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSend),
            });

            if (!response.ok) throw new Error('Échec de la mise à jour');

            const updatedData = await response.json();

            setSuccessMessage('Mise à jour réussie !');


            onSaveSuccess(updatedData);

            setTimeout(() => {
                setSuccessMessage(null);
                setEditMode(false);
                setIsSaving(false);
            }, 2000);

        }catch (error) {
            console.error('Erreur:', error);
            setErrorMessage('Échec de la mise à jour');
            setIsSaving(false);
            setTimeout(() => {
                setErrorMessage(null);
            }, 3000);
        }
        
    };

    return (
        <div className="modal-overlay-plaintePblem" onClick={onClose}>
               {successMessage && (
    <div className="success-messagePlaintePblem">
        {successMessage}
    </div>
)}

{errorMessage && (
    <div className="error-messagePlaintePblem">
        {errorMessage}
    </div>
)}

            <div className="modal-content-plaintePblem" onClick={(e) => e.stopPropagation()}>
                <button className="close-modal" onClick={onClose}>
                    <FontAwesomeIcon icon={faTimes} />
                </button>

                <h2>Détails de la plainte {selectedPlainte.crm_case}</h2>

                {editMode ? (
                    <div className="edit-form">
                        <div className="form-group">
                            <label>Gouvernorat:</label>
                            <select
                                name="Gouvernorat"
                                value={formData.Gouvernorat}
                                onChange={handleInputChange}
                            >
                                <option value="">Sélectionnez un gouvernorat</option>
                                {GOUVERNORATS.map(gouv => (
                                    <option key={gouv.id} value={gouv.name}>
                                        {gouv.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Délégation:</label>
                            <input
                                type="text"
                                name="Delegation"
                                value={formData.Delegation || ''}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="form-group">
                            <label>Logitude:</label>
                            <input
                                type="number"
                                name="LONGITUDE_SITE"
                                value={formData.LONGITUDE_SITE || ''}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>Latitude:</label>
                            <input
                                type="number"
                                name="LATITUDE_SITE"
                                value={formData.LATITUDE_SITE || ''}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="form-group">
                            <label>Description:</label>
                            <textarea
                                name="Description"
                                value={formData.Description || ''}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>Détail du problème:</label>
                            <input
                                type="text"
                                name="Detail"
                                value={formData.Detail || ''}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>Client:</label>
                            <input
                                type="text"
                                name="CLIENT"
                                value={formData.CLIENT || ''}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>Contact Client:</label>
                            <input
    type="text"
    name="CONTACT_CLIENT"
    value={formData.CONTACT_CLIENT || ''}
    onChange={handleInputChange}
    pattern="\d{8,11}"
    title="Le numéro doit contenir entre 8 et 11 chiffres"
/>
                        </div>

                        <div className="form-group">
                            <label>Contact 2 Client:</label>
                            <input
    type="text"
    name="CONTACT2_CLIENT"
    value={formData.CONTACT2_CLIENT || ''}
    onChange={handleInputChange}
    pattern="\d{8,11}"
    title="Le numéro doit contenir entre 8 et 11 chiffres"
/>

                        </div>

                        <div className="modal-actions">
                            <button
                                className="save-btn"
                                onClick={handleSaveChanges}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <>
                                        <FontAwesomeIcon icon={faSpinner} spin />
                                        <span style={{ marginLeft: '8px' }}>Enregistrement...</span>
                                    </>
                                ) : (
                                    <>
                                        <FontAwesomeIcon icon={faSave} /> Enregistrer
                                    </>
                                )}
                            </button>
                            <button
                                className="cancel-btn"
                                onClick={() => setEditMode(false)}
                                disabled={isSaving}
                            >
                                <FontAwesomeIcon icon={faUndo} /> Annuler
                            </button>
                        </div>
                    </div>
                ) : (

                    <div className="plainte-details">
                        <div className="detail-row">
                            <span className="detail-label">Statut:</span>
                            <span className={`detail-value status-${selectedPlainte.STATUT?.replace(/\s+/g, '-').toLowerCase()}`}>
                                {selectedPlainte.STATUT}
                            </span>
                        </div>

                        <div className="detail-row">
                            <span className="detail-label">Date création:</span>
                            <span className="detail-value">
                                {new Date(selectedPlainte.DATE_CREATION_CRM).toLocaleDateString('fr-FR')}
                            </span>
                        </div>

                        <div className="detail-row">
                            <span className="detail-label">Description:</span>
                            <span className="detail-value">
                                {selectedPlainte.Description}
                            </span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Localisation:</span>
                            <span className="detail-value">
                                {selectedPlainte.LATITUDE_SITE && selectedPlainte.LONGITUDE_SITE ? (
                                    <a
                                        href={`https://www.google.com/maps?q=${selectedPlainte.LATITUDE_SITE},${selectedPlainte.LONGITUDE_SITE}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="map-link"
                                    >
                                        <FontAwesomeIcon icon={faMap} /> Voir carte
                                    </a>
                                ) : 'N/A'}
                            </span>
                        </div>

                        <div className="detail-row">
                            <span className="detail-label">Gouvernorat:</span>
                            <span className="detail-value">{selectedPlainte.Gouvernorat}</span>
                        </div>

                        <div className="detail-row">
                            <span className="detail-label">Délégation:</span>
                            <span className="detail-value">{selectedPlainte.Delegation}</span>
                        </div>


                        <div className="detail-row">
                            <span className="detail-label">Détail du problème:</span>
                            <span className="detail-value">{selectedPlainte.Detail}</span>
                        </div>

                        <div className="detail-row">
                            <span className="detail-label">MSISDN:</span>
                            <span className="detail-value">{selectedPlainte.MSISDN}</span>
                        </div>

                        <div className="detail-row">
                            <span className="detail-label">Client:</span>
                            <span className="detail-value">{selectedPlainte.CLIENT}</span>
                        </div>

                        <div className="detail-row">
                            <span className="detail-label">Contact Client:</span>
                            <span className="detail-value">{selectedPlainte.CONTACT_CLIENT}</span>
                        </div>

                        <div className="detail-row">
                            <span className="detail-label">Contact 2 Client:</span>
                            <span className="detail-value">{selectedPlainte.CONTACT2_CLIENT}</span>
                        </div>

                        <div className="detail-row">
                            <span className="detail-label">Réparateur STT:</span>
                            <span className="detail-value">{selectedPlainte.REP_TRAVAUX_STT}</span>
                        </div>

                        <div className="detail-row">
                            <span className="detail-label">Nom STT:</span>
                            <span className="detail-value">{selectedPlainte.NAME_STT}</span>
                        </div>

                        <div className="detail-row">
                            <span className="detail-label">Date affectation STT:</span>
                            <span className="detail-value">
                                {selectedPlainte.DATE_AFFECTATION_STT
                                    ? new Date(selectedPlainte.DATE_AFFECTATION_STT).toLocaleDateString('fr-FR')
                                    : 'N/A'}
                            </span>
                        </div>

                        <div className="detail-row">
                            <span className="detail-label">Pack:</span>
                            <span className="detail-value">{selectedPlainte.DES_PACK}</span>
                        </div>

                        <div className="detail-row">
                            <span className="detail-label">Offre:</span>
                            <span className="detail-value">{selectedPlainte.offre}</span>
                        </div>

                        <div className="detail-row">
                            <span className="detail-label">Date ouverture Timos:</span>
                            <span className="detail-value">
                                {selectedPlainte.OPENING_DATE_SUR_TIMOS
                                    ? new Date(selectedPlainte.OPENING_DATE_SUR_TIMOS).toLocaleDateString('fr-FR')
                                    : 'N/A'}
                            </span>
                        </div>

                        <div className="detail-row">
                            <span className="detail-label">Réponse RDV:</span>
                            <span className="detail-value">{selectedPlainte.REP_RDV}</span>
                        </div>

                        <div className="detail-row">
                            <span className="detail-label">Date prise RDV:</span>
                            <span className="detail-value">
                                {selectedPlainte.DATE_PRISE_RDV
                                    ? new Date(selectedPlainte.DATE_PRISE_RDV).toLocaleDateString('fr-FR')
                                    : 'N/A'}
                            </span>
                        </div>

                        <div className="detail-row">
                            <span className="detail-label">Commentaire RDV:</span>
                            <span className="detail-value">{selectedPlainte.CMT_RDV}</span>
                        </div>

                        <div className="modal-actions">
                            <button className="edit-btnProblemPlaint" onClick={() => setEditMode(true)}>
                                <FontAwesomeIcon icon={faEdit} /> Modifier
                            </button>

                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlainteModal;