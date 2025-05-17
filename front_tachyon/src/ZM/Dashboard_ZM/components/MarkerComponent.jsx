import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

const statusIcons = {
  'en cours': L.divIcon({
    html: `<div style="
      width: 3; 
      height: 3; 
      border-left: 3px solid transparent;
      border-right: 3px solid transparent;
      border-bottom: 6px solid orange;
    "></div>`,
    iconSize: [5, 5],
    className: 'custom-icon',
  }),
  'terminé': L.divIcon({
    html: `<div style="
      background-color:orange; 
      width: 5px; 
      height: 5px;
    "></div>`,
    iconSize: [5, 5],
    className: 'custom-icon',
  }),
  'abandonné': L.divIcon({
    html: `<div style="
      background-color: orange; 
      width: 5px; 
      height: 5px; 
      border-radius: 50%;
    "></div>`,
    iconSize: [5, 5],
    className: 'custom-icon',
  }),
'gelé': L.divIcon({
  html: `<div style="
    width: 0;
    height: 0;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-bottom: 9px solid orange;
    position: relative;
    margin: auto;
  ">
    <div style="
      position: absolute;
      top: -5px;
      left: -5px;
      width: 0;
      height: 0;
      border-left: 5px solid transparent;
      border-right: 5px solid transparent;
      border-top: 7px solid orange;
    "></div>
  </div>`,
  iconSize: [5, 5],
  className: 'custom-icon',
}),


  'default': L.divIcon({
    html: `<div style="
      background-color: blue; 
      width: 5px; 
      height: 5px; 
      border-radius: 50%;
    "></div>`,
    iconSize: [8, 8],
    className: 'custom-icon',
  }),
};

const statusIconsPlainte = {
  'en cours': L.divIcon({
    html: `<div style="
      width: 3; 
      height: 3; 
      border-left: 3px solid transparent;
      border-right: 3px solid transparent;
      border-bottom: 6px solid blue;
    "></div>`,
    iconSize: [5, 5],
    className: 'custom-icon',
  }),
  'terminé': L.divIcon({
    html: `<div style="
      background-color:blue; 
      width: 5px; 
      height: 5px;
    "></div>`,
    iconSize: [5, 5],
    className: 'custom-icon',
  }),
  'abandonné': L.divIcon({
    html: `<div style="
      background-color: blue; 
      width: 5px; 
      height: 5px; 
      border-radius: 50%;
    "></div>`,
    iconSize: [5, 5],
    className: 'custom-icon',
  }),
'gelé': L.divIcon({
  html: `<div style="
    width: 0;
    height: 0;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-bottom: 9px solid blue;
    position: relative;
    margin: auto;
  ">
    <div style="
      position: absolute;
      top: -5px;
      left: -5px;
      width: 0;
      height: 0;
      border-left: 5px solid transparent;
      border-right: 5px solid transparent;
      border-top: 7px solid blue;
    "></div>
  </div>`,
  iconSize: [5, 5],
  className: 'custom-icon',
}),


  'default': L.divIcon({
    html: `<div style="
      background-color: blue; 
      width: 5px; 
      height: 5px; 
      border-radius: 50%;
    "></div>`,
    iconSize: [8, 8],
    className: 'custom-icon',
  }),
};
// Custom icons for other data types
const dataTypeIcons = {
  plainte: L.divIcon({
    html: `<div style="background-color: blue; width: 5px; height: 5px; border-radius: 50%;"></div>`,
    iconSize: [5, 5],
    className: 'custom-icon',
  }),
  resiliation: L.divIcon({
    html: `<div style="background-color: red; width: 5px; height: 5px; border-radius: 50%;"></div>`,
    iconSize: [5, 5],
    className: 'custom-icon',
  }),
};

const getStatusIcon = (statut) => {
  const lowerStatus = (statut || '').toLowerCase();
  return statusIcons[lowerStatus] || statusIcons['default'];
};

const getStatusIconPlainte = (statut) => {
  const lowerStatus = (statut || '').toLowerCase();
  return statusIconsPlainte[lowerStatus] || statusIconsPlainte['default'];
};
const MarkerComponent = ({ dataType, filteredActivations, filteredPlaintes, filteredResiliations }) => {
  const formatCoordinate = (coord) => {
    if (coord === undefined || coord === null) return 'N/A';
    const num = Number(coord);
    return isNaN(num) ? 'N/A' : num.toFixed(4);
  };

  const getPosition = (item, isPlainte = false) => {
    if (isPlainte) {
      const lat = item.latitude_site || item.LATITUDE_SITE;
      const lng = item.longitude_site || item.LONGITUDE_SITE;
      return [lat, lng];
    }
    return [item.LATITUDE_SITE, item.LONGITUDE_SITE];
  };

  const isValidPosition = (position) => {
    return position && position[0] !== undefined && position[1] !== undefined && 
           !isNaN(position[0]) && !isNaN(position[1]);
  };

  return (
    <>
      {(dataType === 'both' || dataType === 'activation') &&
        filteredActivations.map((activation, index) => {
          const position = getPosition(activation);
          if (!isValidPosition(position)) return null;
          
          return (
            <Marker
              key={`activation-${index}`}
              position={position}
              icon={getStatusIcon(activation.STATUT)}
            >
              <Popup>
                <div>
                  <h3>Détails de l'activation</h3>
                  <p><strong>Statut:</strong> {activation.STATUT || 'Non spécifié'}</p>
                  <p><strong>CRM Case:</strong> {activation.crm_case}</p>
                  <p><strong>Date de création:</strong> {new Date(activation.DATE_CREATION_CRM).toLocaleDateString()}</p>
                  <p><strong>Latitude:</strong> {formatCoordinate(activation.LATITUDE_SITE)}</p>
                  <p><strong>Longitude:</strong> {formatCoordinate(activation.LONGITUDE_SITE)}</p>
                  <p><strong>MSISDN:</strong> {activation.MSISDN}</p>
                  <p><strong>Contact Client:</strong> {activation.CONTACT_CLIENT}</p>
                  <p><strong>Client:</strong> {activation.CLIENT}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}

      {(dataType === 'both' || dataType === 'plainte') &&
        filteredPlaintes.map((plainte, index) => {
          const position = getPosition(plainte, true);
          if (!isValidPosition(position)) return null;
          
          return (
            <Marker
              key={`plainte-${index}`}
              position={position}
              icon={getStatusIconPlainte(plainte.STATUT)}
            >
              <Popup>
                <div>
                  <h3>Détails de la plainte</h3>
                  <p><strong>CRM Case:</strong> {plainte.crm_case}</p>
                  <p><strong>Date de création:</strong> {new Date(plainte.date_creation_crm || plainte.DATE_CREATION_CRM).toLocaleDateString()}</p>
                  <p><strong>Latitude:</strong> {formatCoordinate(plainte.latitude_site || plainte.LATITUDE_SITE)}</p>
                  <p><strong>Longitude:</strong> {formatCoordinate(plainte.longitude_site || plainte.LONGITUDE_SITE)}</p>
                  <p><strong>MSISDN:</strong> {plainte.msisdn || plainte.MSISDN}</p>
                  <p><strong>Contact Client:</strong> {plainte.contact_client || plainte.CONTACT_CLIENT}</p>
                  <p><strong>Client:</strong> {plainte.client || plainte.CLIENT}</p>
                  <p><strong>STT:</strong> {plainte.STT || plainte.NAME_STT}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}

      {(dataType === 'both' || dataType === 'resiliation') &&
        filteredResiliations.map((res, index) => {
          const position = getPosition(res, true);
          if (!isValidPosition(position)) return null;
          
          return (
            <Marker
              key={`resiliation-${index}`}
              position={position}
              icon={dataTypeIcons['resiliation']}
            >
              <Popup>
                <div>
                  <h3>Détails de la résiliation</h3>
                  <p><strong>CRM Case:</strong> {res.crm_case}</p>
                  <p><strong>Date de création:</strong> {new Date(res.date_creation_crm || res.DATE_CREATION_CRM).toLocaleDateString()}</p>
                  <p><strong>Latitude:</strong> {formatCoordinate(res.latitude_site || res.LATITUDE_SITE)}</p>
                  <p><strong>Longitude:</strong> {formatCoordinate(res.longitude_site || res.LONGITUDE_SITE)}</p>
                  <p><strong>MSISDN:</strong> {res.msisdn || res.MSISDN}</p>
                  <p><strong>Contact Client:</strong> {res.contact_client || res.CONTACT_CLIENT}</p>
                  <p><strong>Client:</strong> {res.client || res.CLIENT}</p>
                  <p><strong>STT:</strong> {res.STT || res.NAME_STT}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}
    </>
  );
};

export default MarkerComponent;
