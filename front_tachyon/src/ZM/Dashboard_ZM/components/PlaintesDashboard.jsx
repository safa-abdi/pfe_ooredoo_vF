import React, { useState, useEffect } from 'react';
import { useLocation, Routes, Route, Link } from 'react-router-dom';
import PlainteStatusView from '../components/PlainteStatusView';
import PlainteMapView from '../components/PlainteMapView';
import NavbarHorizontal from '../../navbar/NavbarHorizontal';
import NavbarVertical from '../../navbar/NavbarVertical';

const PlaintesDashboard = () => {
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const location = useLocation();

  const toggleNavbar = () => {
    setIsNavbarVisible(prev => !prev);
  };

  return (
    <div className="zm-dashboard">
      <NavbarHorizontal />
      <div className="zm-content">
        <NavbarVertical isVisible={isNavbarVisible} toggleNavbar={toggleNavbar} />
        <div className={`zm-main ${isNavbarVisible ? 'nav-expanded' : 'nav-collapsed'}`}>
          <div className="zm-tabDashs">
            <Link 
              to="/plaintes" 
              className={`zm-tabDash ${location.pathname === '/plaintes' ? 'active' : ''}`}
            >
              Vue Carte
            </Link>
            <Link 
              to="/plaintes/frozen" 
              className={`zm-tabDash ${location.pathname.includes('/frozen') ? 'active' : ''}`}
            >
              Frozen
            </Link>
            <Link 
              to="/plaintes/non_affected" 
              className={`zm-tabDash ${location.pathname.includes('/non_affected') ? 'active' : ''}`}
            >
              Non Affecté
            </Link>
            <Link 
              to="/plaintes/En_rdv" 
              className={`zm-tabDash ${location.pathname.includes('/En_rdv') ? 'active' : ''}`}
            >
              En RDV
            </Link>
            <Link 
              to="/plaintes/En_travaux" 
              className={`zm-tabDash ${location.pathname.includes('/En_travaux') ? 'active' : ''}`}
            >
              En Travaux
            </Link>
          </div>

          <Routes>
            <Route path="/" element={<PlainteMapView />} />
            <Route path="/frozen" element={<PlainteStatusView status="frozen" />} />
            <Route path="/non_affected" element={<PlainteStatusView status="non_affected" />} />
            <Route path="/En_rdv" element={<PlainteStatusView status="En_rdv" />} />
            <Route path="/En_travaux" element={<PlainteStatusView status="En_travaux" />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default PlaintesDashboard;