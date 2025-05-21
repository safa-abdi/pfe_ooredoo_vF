import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './CriticalCasesComponent.css';
import { motion } from "framer-motion";
// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const CriticalCasesComponent = ({ activeTab, cases }) => {
  const [viewMode, setViewMode] = useState('table');
  const [isLoading, setIsLoading] = useState(false);

  const renderMap = () => {
    const validCases = cases.filter(c => c.LATITUDE_SITE && c.LONGITUDE_SITE && c.LATITUDE_SITE !== 0 && c.LONGITUDE_SITE !== 0);
    
    if (validCases.length === 0) {
      return <div className="no-data-container">Aucune donnée de localisation disponible pour les cas critiques</div>;
    }

    // Calculate center of the map based on markers
    const avgLat = validCases.reduce((sum, c) => sum + c.LATITUDE_SITE, 0) / validCases.length;
    const avgLng = validCases.reduce((sum, c) => sum + c.LONGITUDE_SITE, 0) / validCases.length;

    return (
      <div className="map-container">
        <MapContainer 
          center={[avgLat, avgLng]} 
          zoom={7} 
          style={{ height: '500px', width: '100%', borderRadius: '8px' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {validCases.map((caseItem, index) => (
            <Marker 
              key={index} 
              position={[caseItem.LATITUDE_SITE, caseItem.LONGITUDE_SITE]}
            >
              <Popup>
                <div>
                  <h4>Cas CRM: {caseItem.crm_case}</h4>
                  <p>Client: {caseItem.CLIENT}</p>
                  <p>MSISDN: {caseItem.MSISDN}</p>
                  <p>STT: {caseItem.NAME_STT}</p>
                  <p>Date affectation: {new Date(caseItem.DATE_AFFECTATION_STT).toLocaleString('fr-FR')}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    );
  };

  const renderTable = () => {
    if (cases.length === 0) {
      return <div className="no-data-container">Aucun cas critique disponible</div>;
    }

    return (
      <div className="tableCrit-container">
        <table>
          <thead>
            <tr>
              <th>Cas CRM</th>
              <th>Client</th>
              <th>MSISDN</th>
              <th>STT</th>
              <th>Date Affectation</th>
              <th>Coordonnées</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((caseItem, index) => (
              <tr key={index}>
                <td>{caseItem.crm_case}</td>
                <td>{caseItem.CLIENT}</td>
                <td>{caseItem.MSISDN}</td>
                <td>{caseItem.NAME_STT}</td>
                <td>{new Date(caseItem.DATE_AFFECTATION_STT).toLocaleString('fr-FR')}</td>
                <td>
                  {caseItem.LATITUDE_SITE && caseItem.LONGITUDE_SITE && caseItem.LATITUDE_SITE !== 0 && caseItem.LONGITUDE_SITE !== 0 
                    ? `${caseItem.LATITUDE_SITE.toFixed(6)}, ${caseItem.LONGITUDE_SITE.toFixed(6)}` 
                    : 'Non disponible'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Chargement des cas critiques...</p>
      </div>
    );
  }

  return (
    <motion.div className="critical-cases-section">
      <div className="section-header">
        <h3>Cas SLA Critiques ({activeTab}) - {cases?.length || 0} cas</h3>
        <div className="view-toggle">
          <button
            onClick={() => setViewMode('table')}
            className={viewMode === 'table' ? 'active' : ''}
          >
            Tableau
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={viewMode === 'map' ? 'active' : ''}
          >
            Carte
          </button>
        </div>
      </div>
      
      {viewMode === 'map' ? renderMap() : renderTable()}
    </motion.div>
  );
};

export default CriticalCasesComponent;