import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBroadcastTower } from "@fortawesome/free-solid-svg-icons";
import {
  faUser,
  faPhoneAlt,
  faMapMarkerAlt,
  faInfoCircle,
} from '@fortawesome/free-solid-svg-icons';
import './ActivationDetails.css';
import { faCalendar } from "@fortawesome/free-solid-svg-icons";
import { faUserCog } from "@fortawesome/free-solid-svg-icons";

const ActivationDetails = ({ activation }) => {
  if (!activation) {
    return (
      <div className="activation-details-empty">
        <FontAwesomeIcon icon={faInfoCircle} className="icon-info" />
        <p>Aucune activation sélectionnée</p>
      </div>
    );
  }

  return (
    <div className="activation-details">
      <h2 className="details-title">
        <FontAwesomeIcon icon={faInfoCircle} className="icon-title" />
        Détails de l'Activation
      </h2>
      <div className="details-section">
        <h3 className="section-title">
        <FontAwesomeIcon icon={faCalendar} className="icon-section" />
        Dates 
        </h3>
        <div className="details-grid">
          <div className="detail-item">
            <span className="detail-label">DATE CREATION en CRM:</span>
            <span className="detail-value">
              {new Intl.DateTimeFormat('fr-FR', {
                dateStyle: 'short',
                timeStyle: 'medium'
              }).format(new Date(activation.DATE_CREATION_CRM))}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Date ouverture en TIMOS:</span>
            <span className="detail-value">
              {new Intl.DateTimeFormat('fr-FR', {
                dateStyle: 'short',
                timeStyle: 'medium'
              }).format(new Date(activation.OPENING_DATE_SUR_TIMOS))}
            </span>
          </div>
        </div>
      </div>

      <div className="details-section">
        <h3 className="section-title">
          <FontAwesomeIcon icon={faUser} className="icon-section" />
          Informations Client
        </h3>
        <div className="details-grid">
          <div className="detail-item">
            <span className="detail-label">Client:</span>
            <span className="detail-value">{activation.CLIENT}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Contact:</span>
            <span className="detail-value">
              <FontAwesomeIcon icon={faPhoneAlt} className="icon-detail" />
              {activation.CONTACT_CLIENT}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">MSISDN:</span>
            <span className="detail-value">{activation.MSISDN}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">CRM Case:</span>
            <span className="detail-value">{activation.crm_case}</span>
          </div>
        </div>
      </div>

      <div className="details-section">
        <h3 className="section-title">
          <FontAwesomeIcon icon={faMapMarkerAlt} className="icon-section" />
          Localisation
        </h3>
        <div className="details-grid">
          <div className="detail-item">
            <span className="detail-label">Gouvernorat:</span>
            <span className="detail-value">{activation.Gouvernorat}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Délégation:</span>
            <span className="detail-value">{activation.Delegation}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Coordonnées:</span>
            <span className="detail-value">
              {activation.LATITUDE_SITE}, {activation.LONGITUDE_SITE}
            </span>
          </div>
        </div>
      </div>

      <div className="details-section">
        <h3 className="section-title">
        <FontAwesomeIcon icon={faUserCog} className="icon-section" />
        STT 
        </h3>
        <div className="details-grid">
        <div className="detail-item">
            <span className="detail-label">STT:</span>
            <span className="detail-value">{activation.NAME_STT}</span>
          </div>
          {activation.DATE_AFFECTATION_STT && (
            <div className="detail-item">
              <span className="detail-label">Date affectation STT:</span>
              <span className="detail-value">
                {new Intl.DateTimeFormat('fr-FR', {
                  dateStyle: 'short',
                  timeStyle: 'medium'
                }).format(new Date(activation.DATE_AFFECTATION_STT))}
              </span>
            </div>
          )}
          <div className="detail-item">
            <span className="detail-label">Réponse Travaux STT:</span>
            <span className="detail-value">{activation.REP_TRAVAUX_STT}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Statut:</span>
            <span className="detail-value">{activation.STATUT}</span>
          </div>
        </div>
      </div>

      <div className="details-section">
        <h3 className="section-title">
          <FontAwesomeIcon icon={faBroadcastTower}  className="icon-section" />
          Offre
        </h3>
        <div className="details-grid">

          <div className="detail-item">
            <span className="detail-label">OFFRE:</span>
            <span className="detail-value">{activation.offre}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Pack:</span>
            <span className="detail-value">{activation.DES_PACK}</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ActivationDetails;