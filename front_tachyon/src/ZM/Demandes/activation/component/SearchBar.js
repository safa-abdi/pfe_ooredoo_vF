import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

const SearchBar = ({ onChange, onSearch }) => {
  return (
    <div className="search-containerAct">
      <input
        type="text"
        placeholder="Rechercher par client, MSISDN, numéro client ou CRM..."
        onChange={onChange}
        className="search-input"
      />
      <button onClick={onSearch} className="search-buttonAct">
        <FontAwesomeIcon icon={faSearch} className="search-iconAct" />
      </button>
    </div>
  );
};

export default SearchBar;