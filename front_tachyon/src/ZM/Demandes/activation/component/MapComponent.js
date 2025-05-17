import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

const MapComponent = ({ activations, onDeselect }) => {
  return (
    <MapContainer center={[36.8, 10.18]} zoom={2} style={{ height: '400px', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {activations.map((activation, index) => (
        <Marker 
          key={index} 
          position={[activation.LATITUDE_SITE, activation.LONGITUDE_SITE]}
        >
          <Popup>
            <div>
              <h4>{activation.CLIENT || 'Client inconnu'}</h4>
              <p>MSISDN: {activation.MSISDN}</p>
              <p>Localisation: {activation.Delegation}, {activation.Gouvernorat}</p>
              <button 
                onClick={() => onDeselect(activation.crm_case)}
                className="deselect-marker-btn"
              >
                Désélectionner
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapComponent;