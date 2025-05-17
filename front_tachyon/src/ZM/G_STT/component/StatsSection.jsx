import React from 'react';
import { FaTachometerAlt, FaCheckCircle, FaExclamationTriangle, FaBan } from 'react-icons/fa';

const StatsSection = ({ 
  totalSTT, 
  mostActiveSTT, 
  mostDelayedSTT,
  blockedCompanies, 
  blockedBranches, 
  toggleBlockedModal 
}) => {
    return (
        <div className="stats-grid">
            <div className="stat-card">
                <FaTachometerAlt className="stat-icon" />
                <h3 className='gray'>Total</h3>
                <p>{totalSTT}</p>
            </div>
            <div className="stat-card">
                <FaCheckCircle className="stat-icon3" />
                <h3 className='green'>Le plus actif</h3>
                <p>{mostActiveSTT.name || 'Aucun'} ({mostActiveSTT.workCompleted} projets)</p>
            </div>
            <div className="stat-card">
                <FaExclamationTriangle className="stat-icon2" />
                <h3 className='yellow'>Le plus en retard </h3>
                <p>
                    {mostDelayedSTT.sttName || 'Aucun'} 
                    {mostDelayedSTT.averageDelayHours && 
                        ` (${mostDelayedSTT.averageDelayHours.toFixed(2)} heures)`
                    }
                </p>
            </div>
            <div className="stat-card" onClick={toggleBlockedModal} style={{ cursor: 'pointer' }}>
                <FaBan className="stat-icon4" />
                <h3 className='red'>Nb STT bloqués</h3>
                <p>{blockedCompanies.length + blockedBranches.length}</p>
            </div>
        </div>
    );
};

export default StatsSection;