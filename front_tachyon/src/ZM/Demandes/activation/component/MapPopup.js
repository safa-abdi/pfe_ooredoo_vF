import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Modal from 'react-modal';

Modal.setAppElement('#root');

const markerIcon = new L.Icon({
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const MapPopup = ({ isOpen, onRequestClose, latitude, longitude, onAssignSTT, repTravauxSTT, statut, matchingSTTs, allSTTs }) => {
  const [selectedSTT, setSelectedSTT] = useState(null);
  const [showAllSTTs, setShowAllSTTs] = useState(false);
  const [assignMessage, setAssignMessage] = useState(null);
  const position = [latitude, longitude];
  const STTList = showAllSTTs ? allSTTs : matchingSTTs;

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Carte CGPS"
      style={{
        content: {
          width: '50%',
          height: '70%',
          margin: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        },
      }}
    >
      <h2>Coordonnées GPS</h2>
      <div style={{ width: '100%', height: '60%' }}>
        <MapContainer center={position} zoom={13} style={{ width: '100%', height: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <Marker position={position} icon={markerIcon}>
            <Popup>Coordonnées : {latitude}, {longitude}</Popup>
          </Marker>
        </MapContainer>
      </div>

      {STTList && STTList.length > 0 && (
        <div style={{ width: '100%', margin: '10px 0' }}>
          <label>Sélectionnez un STT: </label>
          <select
            onChange={(e) => setSelectedSTT(STTList.find(stt => stt.name === e.target.value))}
            style={{ width: '100%', padding: '5px' }}
          >
            <option value="">-- Choisir un STT --</option>
            {STTList.map((stt, index) => (
              <option key={index} value={stt.name}>
                {`${stt.name} (En cours : ${stt.progressCount || 0})`}
              </option>
            ))}
          </select>
        </div>
      )}

      <button
        onClick={() => setShowAllSTTs(prev => !prev)}
        style={{ marginTop: '5px', padding: '5px 10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
      >
        {showAllSTTs ? 'Voir uniquement les STTs correspondants' : 'Voir tous les STTs'}
      </button>

      {statut === 'En cours' && (
        <button
         onClick={async () => {
  try {
    const result = await onAssignSTT(selectedSTT);
    if (result) {
      onRequestClose(); // Close modal
      setSelectedSTT(null);
      setAssignMessage('STT affecté avec succès !');
    }
  } catch (error) {
    setAssignMessage(`Erreur : ${error.message}`);
  }
}}
        >
          Affecter STT
        </button>
      )}
      {repTravauxSTT === 'en cours' && (
        <button
          onClick={() => onAssignSTT(selectedSTT)}
          style={{ marginTop: '10px' }}
          disabled={!selectedSTT}
        >
          Réaffecter STT
        </button>
      )}
      {assignMessage && (
        <p
          style={{
            marginTop: '10px',
            color: assignMessage.includes('Erreur') ? 'red' : 'green',
            fontWeight: 'bold',
          }}
        >
          {assignMessage}
        </p>
      )}
    </Modal>
  );
};

export default MapPopup;
