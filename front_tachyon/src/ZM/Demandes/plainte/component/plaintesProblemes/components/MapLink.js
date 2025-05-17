import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMap } from '@fortawesome/free-solid-svg-icons';

const MapLink = ({ latitude, longitude }) => {
    if (!latitude || !longitude) return 'N/A';

    return (
        <a
            href={`https://www.google.com/maps?q=${latitude},${longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="map-link"
        >
            <FontAwesomeIcon icon={faMap} /> Voir carte
        </a>
    );
};

export default MapLink;