import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from "react-router-dom";

const NavbarVertical = ({ isVisible, toggleNavbar }) => {
  const [showSubMenu, setShowSubMenu] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setShowSubMenu(false);
  }, [location.pathname]);

  return (
    <>
      <button className="navbar-toggle-btn" onClick={toggleNavbar}>
        {isVisible ? '◄' : '►'}
      </button>

      <nav className={`navbar-vertical ${isVisible ? 'visible' : 'hidden'}`}>
        <ul>
          <h3>&nbsp;</h3>
          <li><NavLink to="/ZM-dashboard">Dashboard</NavLink></li>
          <li><NavLink to="/demandes">Activation</NavLink></li>

          <li className="has-submenu">
  <button
    onClick={(e) => {
      e.preventDefault();
      setShowSubMenu(!showSubMenu);
    }}
    className="nav-link" 
    style={{
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      width: '100%',
      textAlign: 'left',
      padding: '10px 15px',
      color: showSubMenu ? '#ED1C24' : '#333',
      fontWeight: showSubMenu ? 'bold' : 'normal'
    }}
  >
    Plainte & déménagement {showSubMenu ? '▲' : '▼'}
  </button>

  {showSubMenu && (
    <ul className="submenu">
      <li><NavLink to="/ZM-Plaintes">Toutes les plaintes</NavLink></li>
      <li><NavLink to="/Plaintes-problem">Plaintes avec problèmes</NavLink></li>
    </ul>
  )}
</li>

          <li><NavLink to="/ZM-Resiliations">Resiliation</NavLink></li>
          <li><NavLink to="/G-STT">Gestion STT</NavLink></li>
          <li><NavLink to="/G-STOCK">Gestion Stock</NavLink></li>
        </ul>
      </nav>
    </>
  );
};

export default NavbarVertical;
