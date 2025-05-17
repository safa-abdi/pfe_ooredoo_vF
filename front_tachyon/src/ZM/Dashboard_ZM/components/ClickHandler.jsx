import React, { useEffect, useRef } from 'react';

const ClickHandler = ({ setClickedPosition, setGouvernorat }) => {
  const mapRef = useRef(null); // Définir mapRef ici

  const findGouvernoratFromCoords = async (lat, lng) => {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data && data.address && data.address.state) {
        return data.address.state;
      } else {
        return 'Inconnu';
      }
    } catch (error) {
      console.error('Erreur lors du reverse geocoding:', error);
      return 'Erreur de récupération';
    }
  };

  const handleClick = async (e) => {
    const { lat, lng } = e.latlng;
    setClickedPosition({ lat, lng });

    const governorate = await findGouvernoratFromCoords(lat, lng);
    setGouvernorat(governorate);
  };

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.on('click', handleClick);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.off('click', handleClick);
      }
    };
  }, []);

  return null;
};

export default ClickHandler;
