import React, { useState,useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faUser, faPhoneAlt, faMapMarkerAlt, faMapMarked ,faMobileAlt,   faTowerCell} from '@fortawesome/free-solid-svg-icons';
import { useSttProgressCounts } from '../../../hooks/useSttProgressCounts';
import './style/plainteList.css';
import'./style/plainteItem.css';
import MapPopup from '../../activation/component/MapPopup';
import { BASE_API_URL } from '../../../../config';

const PlainteItem = ({ plainte, isSelected, onToggleSelect, onClick }) => {
  const [assignMessage] = useState('');

  const handleMapIconClick = async (e) => {
    e?.stopPropagation();
    setIsMapPopupOpen(true);
    await findMatchingSTTs(); 
  };

  const [matchingSTTs, setMatchingSTTs] = useState([]);
  const [isMapPopupOpen, setIsMapPopupOpen] = useState(false);

  const sttProgressCounts = useSttProgressCounts(matchingSTTs);
  const handleAssignSTT = async (selectedSTT) => {
    try {
      const requestBody = {
        sttName: selectedSTT.type === 'CompanyDelegation' ? selectedSTT.parentSTT : selectedSTT.name,
        companydelegId: selectedSTT.type === 'CompanyDelegation' ? selectedSTT.id : null,
        companyId: selectedSTT.companyId || selectedSTT.id
      };
  
      const assignResponse = await fetch(`${BASE_API_URL}/plainte/${plainte.crm_case}/assign-stt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
  
      if (!assignResponse.ok) {
        const errorData = await assignResponse.json();
        throw new Error(errorData.message || 'Erreur lors de l\'affectation du STT');
      }
  
      const result = await assignResponse.json();
      return result;
  
    } catch (error) {
      console.error('Assign STT error:', error);
      throw error;
    }
  };
  const handleLinkStt = async (plainte) => {
    try {
      if (!plainte?.crm_case) {
        throw new Error('CRM case is required');
      }
  
      const response = await fetch(
        `${BASE_API_URL}/plainte/linkSingle?crm=${encodeURIComponent(plainte.crm_case)}`, 
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sttId: plainte.sttId,
            sttName: plainte.sttName
          })
        }
      );
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to link plainte');
      }
  
      const result = await response.json();
      return result;
  
    } catch (error) {
      console.error('Link STT error:', error);
      throw error;
    }
  };
  const findMatchingSTTs = async () => {
    try {
      const response = await fetch(`${BASE_API_URL}/companies/unblocked`);
      if (!response.ok) throw new Error('Erreur lors de la récupération des STT');
      
      const sttList = await response.json();
      const foundSTTs = [];
  
      sttList.forEach(stt => {
        if (stt.governorate === plainte.Gouvernorat && 
            (stt.delegation === plainte.Delegation || !stt.delegation) &&
            !stt.blocked) {
          foundSTTs.push({ 
            ...stt, 
            type: 'STT principal',
            companyId: stt.id
          });
        }
      });
      sttList.forEach(stt => {
        if (stt.companyDelegations && Array.isArray(stt.companyDelegations)) {
            stt.companyDelegations.forEach(companyDelegation => {
                if (companyDelegation && companyDelegation.delegation && companyDelegation.delegation.gouver) {
                    if (companyDelegation.delegation.gouver.name === plainte.Gouvernorat && !companyDelegation.blocked) {
                        if (companyDelegation.delegation.name === plainte.Delegation) {
                            foundSTTs.push({ 
                                ...stt,
                                companyDelegationId: companyDelegation.id,
                                type: 'CompanyDelegation',
                                delegationName: companyDelegation.delegation.name,
                                gouvernoratName: companyDelegation.delegation.gouver.name
                            });
                        }
                    }
                }
            });
        }
    });
  
      setMatchingSTTs(foundSTTs);
      console.log("liste stt non bloquées",foundSTTs)

      return foundSTTs;
    } catch (error) {
      console.error(error);
      return [];
    }
  };

  return (
    <div className={`plainte-item ${isSelected ? 'selected' : ''}`}>
    <div className="plainte-item-header">
  <div className="plainte-header-left">
    {plainte.STATUT.toLowerCase() !== 'abandonné' && plainte.STATUT.toLowerCase() !== 'terminé' ? (
      <>
        <label className="custom-checkbox">
          <input 
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onToggleSelect();
            }}
          />
          <span className="checkmark"></span>
        </label>
        <h3 onClick={(e) => {
  e.stopPropagation();
  if (onClick) onClick();
}} style={{ cursor: 'pointer' }}>
  {plainte.crm_case}
</h3>
      </>
    ) : (
      <h3 onClick={onClick} style={{ cursor: 'pointer' }}>
        {plainte.crm_case}
      </h3>
    )}
  </div>
  <div className="plainte-item-msisdn">MSISDN: {plainte.MSISDN}</div>
</div>

    
    <div className="plainte-item-details">
    <p><FontAwesomeIcon icon={faPhoneAlt} className="icon1" /><span>{plainte.CONTACT_CLIENT}</span></p>
    <p><FontAwesomeIcon icon={faMobileAlt} className="icon1" /><span>{plainte.CONTACT2_CLIENT}</span></p>
    <p><FontAwesomeIcon icon={faUser} className="icon1" /><span>{plainte.CLIENT || NaN}</span></p>

      <p><span>{plainte.STATUT}</span></p>
    </div>
    
    <div className="buttonItem">
      <div className="plainte-item-gouvDel">
        <FontAwesomeIcon icon={faMapMarkerAlt} className="icon2" />
        <span>{plainte.Gouvernorat + " , " + plainte.Delegation || 'Non affecté'}</span>
      </div>

      <div className="plainte-item-stt">
        <p><FontAwesomeIcon icon={faTowerCell} className="icon1" />&nbsp;<span>{plainte.NAME_STT ?? "N/A"}</span></p>
      </div>

      <div className="plainte-item-cgrps" onClick={handleMapIconClick}>
  <span>
  <FontAwesomeIcon icon={faMapMarked} onClick={handleMapIconClick} className="icon1" />&nbsp;

    {plainte.LATITUDE_SITE && plainte.LONGITUDE_SITE
      ? `${plainte.LATITUDE_SITE} , ${plainte.LONGITUDE_SITE}`
      : 'CGPS erronées'}
  </span>
</div>

    </div>
    <MapPopup
        isOpen={isMapPopupOpen}
        onRequestClose={() => setIsMapPopupOpen(false)}
        latitude={parseFloat(plainte.LATITUDE_SITE)}
        longitude={parseFloat(plainte.LONGITUDE_SITE)}
        onAssignSTT={handleAssignSTT}
        onLinkSTT={handleLinkStt}
        repTravauxSTT={plainte.REP_TRAVAUX_STT} 
        statut={plainte.STATUT}
        matchingSTTs={matchingSTTs.map(stt => ({
          ...stt,
          progressCount: sttProgressCounts[stt.id] || 0
        }))}
      />
      

    
    {assignMessage && <p className="assign-message">{assignMessage}</p>}
  </div>

  );
};

export default PlainteItem;