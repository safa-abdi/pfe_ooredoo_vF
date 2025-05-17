import React, { useRef, useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

const tunisiaBounds = L.latLngBounds(
  L.latLng(30.0, 7.0),
  L.latLng(38.0, 12.0)
);

const customIcons = {
  activation: L.divIcon({
    html: `<div style="background-color: green; width: 8px; height: 8px; border-radius: 50%;"></div>`,
    iconSize: [8, 8],
    className: 'custom-icon',
  }),
  plainte: L.divIcon({
    html: `<div style="background-color: red; width: 8px; height: 8px; border-radius: 50%;"></div>`,
    iconSize: [8, 8],
    className: 'custom-icon',
  }),
  resiliation: L.divIcon({
    html: `<div style="background-color: blue; width: 8px; height: 8px; border-radius: 50%;"></div>`,
    iconSize: [8, 8],
    className: 'custom-icon',
  }),
};

const reverseGeocode = async (lat, lng) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erreur de géocodage:", error);
    return null;
  }
};

const MapClickHandler = ({ setClickedPosition, onGouvernoratSelect }) => {
  const map = useMapEvents({
    async click(e) {
      const { lat, lng } = e.latlng;
      setClickedPosition({ lat, lng });
      
      const result = await reverseGeocode(lat, lng);
      if (result?.address) {
        const gouvernorat = result.address.state || result.address.county || "Non trouvé";
        onGouvernoratSelect(gouvernorat);
      } else {
        onGouvernoratSelect("Non trouvé");
      }
    },
  });

  return null;
};

const MapComponent = ({
clickedPosition,
  setClickedPosition,
  onGouvernoratSelect,
  filteredActivations = [],
  filteredPlaintes = [],
  filteredResiliations = [],
  highlightMarkers = false,
  centerOn = null
}) => {
  const mapRef = useRef(null);
  const [gouvernorat, setLocalGouvernorat] = useState(null);

  // Ajoutez ce logging pour debugger
  console.log('Activations:', filteredActivations);
  console.log('Plaintes:', filteredPlaintes);
  console.log('Resiliations:', filteredResiliations);

  // Memoization for points - version plus robuste
  const points = useMemo(() => {
    const formatPoint = (item, type) => {
      // Essayez différents noms de propriétés pour les coordonnées
      const lat = parseFloat(
        item.LATITUDE_SITE || 
        item.latitude || 
        item.LATITUDE || 
        item.lat
      );
      const lng = parseFloat(
        item.LONGITUDE_SITE || 
        item.longitude || 
        item.LONGITUDE || 
        item.lng || 
        item.lon
      );

      if (isNaN(lat)) console.warn('Latitude invalide pour:', item);
      if (isNaN(lng)) console.warn('Longitude invalide pour:', item);

      return {
        ...item,
        dataType: type,
        lat,
        lng,
        id: item.id || item.crm_case || Math.random().toString(36).substr(2, 9),
        highlighted: highlightMarkers
      };
    };

    const allPoints = [
      ...filteredActivations.map(a => formatPoint(a, 'activation')),
      ...filteredPlaintes.map(p => formatPoint(p, 'plainte')),
      ...filteredResiliations.map(r => formatPoint(r, 'resiliation'))
    ];

    const validPoints = allPoints.filter(point => !isNaN(point.lat) && !isNaN(point.lng));
    
    console.log('Points valides:', validPoints);
    return validPoints;
  }, [filteredActivations, filteredPlaintes, filteredResiliations, highlightMarkers]);

  const createClusterCustomIcon = (cluster) => {
    return L.divIcon({
      html: `<span>${cluster.getChildCount()}</span>`,
      className: 'custom-marker-cluster',
      iconSize: L.point(40, 40, true)
    });
  };
useEffect(() => {
    if (centerOn && mapRef.current) {
      const { lat, lng } = centerOn;
      mapRef.current.flyTo([lat, lng], 12, {
        duration: 1
      });
    }
  }, [centerOn]);

  return (
    <MapContainer
      center={[34.0, 9.0]}
      zoom={6}
      style={{ width: '100%', height: '100%', zIndex: 1 }}
      maxBounds={tunisiaBounds}
      minZoom={6}
      whenCreated={(map) => {
      mapRef.current = map;
      }}
    >
      <TileLayer
        url="https://api.maptiler.com/maps/basic-v2/{z}/{x}/{y}.png?key=DASfEBT0SLRGxRbpcinb"
        attribution='&copy; <a href="https://www.maptiler.com/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <MapClickHandler 
        setClickedPosition={setClickedPosition} 
        onGouvernoratSelect={onGouvernoratSelect} 
      />

      
        <MarkerClusterGroup
    iconCreateFunction={createClusterCustomIcon}
    spiderfyOnMaxZoom={true}
    showCoverageOnHover={false}
    zoomToBoundsOnClick={true}
  >
    {points.map((point) => (
      <Marker
        key={point.id}
        position={[point.lat, point.lng]}
        icon={L.divIcon({
          html: `<div style="
            background-color: ${point.dataType === 'activation' ? 'green' : point.dataType === 'plainte' ? 'red' : 'blue'};
            width: ${point.highlighted ? '12px' : '8px'};
            height: ${point.highlighted ? '12px' : '8px'};
            border-radius: 50%;
            border: ${point.highlighted ? '2px solid yellow' : 'none'};
            box-shadow: ${point.highlighted ? '0 0 10px yellow' : 'none'};
          "></div>`,
          iconSize: point.highlighted ? [12, 12] : [8, 8],
          className: `custom-icon ${point.highlighted ? 'highlighted-marker' : ''}`,
        })}
      >
        {/* Popup existant */}
      </Marker>
    ))}
  </MarkerClusterGroup>


      {clickedPosition && (
        <Marker
          position={[clickedPosition.lat, clickedPosition.lng]}
          icon={L.divIcon({
            html: `<div style="background-color: orange; width: 5px; height: 5px; border-radius: 50%;"></div>`,
            iconSize: [5, 5],
            className: 'clicked-marker',
          })}
        >
          <Popup>
            📍 Vous avez cliqué ici : <br />
            Latitude: {clickedPosition.lat.toFixed(4)} <br />
            Longitude: {clickedPosition.lng.toFixed(4)} <br />
            Gouvernorat: {gouvernorat || 'Chargement...'}
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
};

export default React.memo(MapComponent);
