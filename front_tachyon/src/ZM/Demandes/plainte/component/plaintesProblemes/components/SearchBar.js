import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';

const SearchBar = ({ 
    searchTerm, 
    onSearchChange, 
    onSearch, 
    loading,
    placeholder = "Rechercher par client, MSISDN, référence..."
}) => {
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            onSearch();
        }
    };

    return (
        <div className="search-bar-container">
            <div className="search-input-wrapper">
                <FontAwesomeIcon icon={faSearch} className="search-icon" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e)} // Passe l'événement complet
                    onKeyPress={handleKeyPress}
                    placeholder={placeholder}
                    className="search-input"
                />
            </div>
        </div>
    );
};

export default SearchBar;