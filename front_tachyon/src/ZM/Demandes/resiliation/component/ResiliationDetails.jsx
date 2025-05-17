import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBroadcastTower, faDesktop, faMobile, faPhone, faPhoneFlip, faPhoneSquare } from "@fortawesome/free-solid-svg-icons";
import {
  faUser,
  faPhoneAlt,
  faMapMarkerAlt,
  faInfoCircle,
} from '@fortawesome/free-solid-svg-icons';
import '../styles/ResiliationDetail.css';
import { faCalendar } from "@fortawesome/free-solid-svg-icons";
import { faUserCog } from "@fortawesome/free-solid-svg-icons";

const ResiliationDetails = ({ resiliation }) => {
  if (!resiliation) {
    return (
      <div className="resiliation-details-empty">
        <FontAwesomeIcon icon={faInfoCircle} className="icon-info" />
        <p>Aucune resiliation sélectionnée</p>
      </div>
    );
  }

  return (
    <div className="resiliation-details">
      <h2 className="details-title">
        <FontAwesomeIcon icon={faInfoCircle} className="icon-title" />
        Détails de la resiliation
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
              }).format(new Date(resiliation.DATE_CREATION_CRM))}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Date ouverture en TIMOS:</span>
            <span className="detail-value">
              {new Intl.DateTimeFormat('fr-FR', {
                dateStyle: 'short',
                timeStyle: 'medium'
              }).format(new Date(resiliation.OPENING_DATE_SUR_TIMOS))}
            </span>
          </div>
          {resiliation.DATE_AFFECTATION_STT && (
            <div className="detail-item">
              <span className="detail-label">Date affectation STT:</span>
              <span className="detail-value">
                {new Intl.DateTimeFormat('fr-FR', {
                  dateStyle: 'short',
                  timeStyle: 'medium'
                }).format(new Date(resiliation.DATE_AFFECTATION_STT))}
              </span>
            </div>
          )}
         
          {resiliation.DATE_FIN_TRV && (
            <div className="detail-item">
              <span className="detail-label">Date Fin travaux:</span>
              <span className="detail-value">
                {new Intl.DateTimeFormat('fr-FR', {
                  dateStyle: 'short',
                  timeStyle: 'medium'
                }).format(new Date(resiliation.DATE_FIN_TRV))}
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
            <span className="detail-value">{resiliation.Detail}</span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Pack:</span>
            <span className="detail-value">{resiliation.DES_PACK}</span>
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
              {resiliation.Description}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Contact:</span>
            <span className="detail-value">
              <FontAwesomeIcon icon={faPhoneSquare} className="icon-detail" />
              {resiliation.CONTACT1_CLIENT}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Contact 2 :</span>
            <span className="detail-value">
              <FontAwesomeIcon icon={faPhoneAlt} className="icon-detail" />
              {resiliation.CONTACT2_CLIENT}
            </span>
          </div>

          <div className="detail-item">
            <span className="detail-label">MSISDN:</span>
            <span className="detail-value">{resiliation.MSISDN}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">CRM Case:</span>
            <span className="detail-value">{resiliation.crm_case}</span>
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
            <span className="detail-value">{resiliation.Gouvernorat}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Délégation:</span>
            <span className="detail-value">{resiliation.Delegation}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Coordonnées:</span>
            <span className="detail-value">
              {resiliation.LATITUDE_SITE}, {resiliation.LONGITUDE_SITE}
            </span>
          </div>
        </div>
      </div>
      {resiliation.NOTE_CLOTURE_ZM && (

      <div className="details-section">
        <h3 className="section-title">
          <FontAwesomeIcon icon={faUser} className="icon-section" />
          Cloture par ZM
        </h3>
        <div className="details-grid">
          <div className="detail-item">
            <span className="detail-label">Note:</span>
            <span className="detail-value">{resiliation.NOTE_CLOTURE_ZM}</span>
          </div>
          <div className="detail-item">
              <span className="detail-label">Date cloture:</span>
              <span className="detail-value">
                {new Intl.DateTimeFormat('fr-FR', {
                  dateStyle: 'short',
                  timeStyle: 'medium'
                }).format(new Date(resiliation.DATE_CLOTURE_ZM))}
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
            <span className="detail-value">{resiliation.STT}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Réponse Travaux STT:</span>
            <span className="detail-value">{resiliation.REP_TRAVAUX_STT}</span>
          </div>
            <div className="detail-item">
            <span className="detail-label">Réponse RDV technicien:</span>
            <span className="detail-value">{resiliation.REP_RDV}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Statut:</span>
            <span className="detail-value">{resiliation.STATUT}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResiliationDetails;