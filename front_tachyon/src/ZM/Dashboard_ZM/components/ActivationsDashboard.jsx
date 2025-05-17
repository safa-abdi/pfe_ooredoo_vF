import React, { useState } from 'react';
import { useLocation, Routes, Route, Link } from 'react-router-dom';
import ActivationStatusView from '../components/ActivationStatusView';
import ActivationMapView from '../components/ActivationMapView';
import NavbarHorizontal from '../../navbar/NavbarHorizontal';
import NavbarVertical from '../../navbar/NavbarVertical';

const ActivationsDashboard = () => {
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
              to="/activations" 
              className={`zm-tabDash ${location.pathname === '/activations' ? 'active' : ''}`}
            >
              Vue Carte
            </Link>
            <Link 
              to="/activations/frozen" 
              className={`zm-tabDash ${location.pathname.includes('/frozen') ? 'active' : ''}`}
            >
              Frozen
            </Link>
            <Link 
              to="/activations/non_affected" 
              className={`zm-tabDash ${location.pathname.includes('/non_affected') ? 'active' : ''}`}
            >
              Non Affecté
            </Link>
            <Link 
              to="/activations/En_rdv" 
              className={`zm-tabDash ${location.pathname.includes('/En_rdv') ? 'active' : ''}`}
            >
              En RDV
            </Link>
            <Link 
              to="/activations/En_travaux" 
              className={`zm-tabDash ${location.pathname.includes('/En_travaux') ? 'active' : ''}`}
            >
              En Travaux
            </Link>
          </div>

          <Routes>
            <Route path="/" element={<ActivationMapView />} />
            <Route path="/frozen" element={<ActivationStatusView status="frozen" />} />
            <Route path="/non_affected" element={<ActivationStatusView status="non_affected" />} />
            <Route path="/En_rdv" element={<ActivationStatusView status="En_rdv" />} />
            <Route path="/En_travaux" element={<ActivationStatusView status="En_travaux" />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default ActivationsDashboard;