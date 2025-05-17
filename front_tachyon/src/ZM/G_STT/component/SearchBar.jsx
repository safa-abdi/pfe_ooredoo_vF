import React from 'react';
import { FaSearch } from 'react-icons/fa';

const SearchBar = ({ searchTerm, onSearchChange }) => {
    return (
        <div className="search-bar2">
            <FaSearch className="search-icon" />
            <input
                type="text"
                placeholder="Rechercher un sous-traitant..."
                value={searchTerm}
                onChange={onSearchChange}
            />
        </div>
    );
};

export default SearchBar;