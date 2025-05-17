import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

const SearchBar2 = ({ onChange, onSearch, onKeyPress }) => {
    return (
      <div className="search-containerDash">
        <input
          type="text"
          placeholder="Rechercher..."
          onChange={onChange}
          onKeyPress={onKeyPress}
          className="search-input"

        />
      <button onClick={onSearch} className="search-buttonDashh">
      <FontAwesomeIcon icon={faSearch} className="search-icon85" />
        </button>
      </div>
    );
  };
  export default SearchBar2;
