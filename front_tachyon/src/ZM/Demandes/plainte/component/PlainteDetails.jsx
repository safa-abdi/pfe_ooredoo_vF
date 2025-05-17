import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBroadcastTower, faDesktop, faMobile, faPhone, faPhoneFlip, faPhoneSquare } from "@fortawesome/free-solid-svg-icons";
import {
  faUser,
  faPhoneAlt,
  faMapMarkerAlt,
  faInfoCircle,
} from '@fortawesome/free-solid-svg-icons';
import './style/PlainteDetails.css';
import { faCalendar } from "@fortawesome/free-solid-svg-icons";
import { faUserCog } from "@fortawesome/free-solid-svg-icons";

const PlainteDetails = ({ plainte }) => {
  if (!plainte) {
    return (
      <div className="plainte-details-empty">
        <FontAwesomeIcon icon={faInfoCircle} className="icon-info" />
        <p>Aucune plainte sélectionnée</p>
      </div>
    );
  }

  return (
    <div className="plainte-details">
      <h2 className="details-title">
        <FontAwesomeIcon icon={faInfoCircle} className="icon-title" />
        Détails de la plainte
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
              }).format(new Date(plainte.DATE_CREATION_CRM))}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Date ouverture en TIMOS:</span>
            <span className="detail-value">
              {new Intl.DateTimeFormat('fr-FR', {
                dateStyle: 'short',
                timeStyle: 'medium'
              }).format(new Date(plainte.OPENING_DATE_SUR_TIMOS))}
            </span>
          </div>
          {plainte.DATE_AFFECTATION_STT && (
            <div className="detail-item">
              <span className="detail-label">Date affectation STT:</span>
              <span className="detail-value">
                {new Intl.DateTimeFormat('fr-FR', {
                  dateStyle: 'short',
                  timeStyle: 'medium'
                }).format(new Date(plainte.DATE_AFFECTATION_STT))}
              </span>
            </div>
          )}
         
          {plainte.DATE_FIN_TRV && (
            <div className="detail-item">
              <span className="detail-label">Date Fin travaux:</span>
              <span className="detail-value">
                {new Intl.DateTimeFormat('fr-FR', {
                  dateStyle: 'short',
                  timeStyle: 'medium'
                }).format(new Date(plainte.DATE_FIN_TRV))}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="details-section">
        <h3 className="section-title">
          <FontAwesomeIcon icon={faUser} className="icon-section" />
          Problème
        </h3>
        <div className="details-grid">
          <div className="detail-item">
            <span className="detail-label">Détail:</span>
            <span className="detail-value">{plainte.Detail}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">OFFRE:</span>
            <span className="detail-value">{plainte.offre}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Pack:</span>
            <span className="detail-value">{plainte.DES_PACK}</span>
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
            <span className="detail-label">Description:</span>
            <span className="detail-value">
              <FontAwesomeIcon icon={faUserCog} className="icon-detail" />
              {plainte.Description}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Contact:</span>
            <span className="detail-value">
              <FontAwesomeIcon icon={faPhoneSquare} className="icon-detail" />
              {plainte.CONTACT_CLIENT}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Contact 2 :</span>
            <span className="detail-value">
              <FontAwesomeIcon icon={faPhoneAlt} className="icon-detail" />
              {plainte.CONTACT2_CLIENT}
            </span>
          </div>

          <div className="detail-item">
            <span className="detail-label">MSISDN:</span>
            <span className="detail-value">{plainte.MSISDN}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">CRM Case:</span>
            <span className="detail-value">{plainte.crm_case}</span>
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
            <span className="detail-value">{plainte.Gouvernorat}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Délégation:</span>
            <span className="detail-value">{plainte.Delegation}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Coordonnées:</span>
            <span className="detail-value">
              {plainte.LATITUDE_SITE}, {plainte.LONGITUDE_SITE}
            </span>
          </div>
        </div>
      </div>
      {plainte.NOTE_CLOTURE_ZM && (

      <div className="details-section">
        <h3 className="section-title">
          <FontAwesomeIcon icon={faUser} className="icon-section" />
          Cloture par ZM
        </h3>
        <div className="details-grid">
          <div className="detail-item">
            <span className="detail-label">Note:</span>
            <span className="detail-value">{plainte.NOTE_CLOTURE_ZM}</span>
          </div>
          <div className="detail-item">
              <span className="detail-label">Date cloture:</span>
              <span className="detail-value">
                {new Intl.DateTimeFormat('fr-FR', {
                  dateStyle: 'short',
                  timeStyle: 'medium'
                }).format(new Date(plainte.DATE_CLOTURE_ZM))}
              </span>
             </div>        
            </div>
      </div>
      )}
      <div className="details-section">
        <h3 className="section-title">
        <FontAwesomeIcon icon={faUserCog} className="icon-section" />
        STT 
        </h3>
        <div className="details-grid">
        <div className="detail-item">
            <span className="detail-label">STT:</span>
            <span className="detail-value">{plainte.NAME_STT}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Réponse Travaux STT:</span>
            <span className="detail-value">{plainte.REP_TRAVAUX_STT}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Statut:</span>
            <span className="detail-value">{plainte.STATUT}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlainteDetails;