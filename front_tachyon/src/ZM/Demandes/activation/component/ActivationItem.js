import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faPhoneAlt, faMapMarkerAlt, faMapMarked, faTowerCell, faUserCheck } from '@fortawesome/free-solid-svg-icons';
import MapPopup from './MapPopup';
import './activationList.css';
import { BASE_API_URL } from '../../../../config';
import { faPersonDigging, faUserSlash, faCheckCircle } from '@fortawesome/free-solid-svg-icons';

const ActivationItem = ({ activation, isSelected, onToggleSelect, onClick, onReassign ,onAssignmentComplete}) => {
  const [isMapPopupOpen, setIsMapPopupOpen] = useState(false);
  const [assignMessage, setAssignMessage] = useState('');
  const [matchingSTTs, setMatchingSTTs] = useState([]);
  const [sttProgressCounts, setSttProgressCounts] = useState({});
  const [allSTTs, setAllSTTs] = useState([]);

  function getStatusIconAndColor(status) {
    switch (status.toLowerCase()) {
      case 'en_cours':
        return {
          icon: faPersonDigging,
          color: '#f26a36',
        };
      case 'non_affecté_stt':
        return {
          icon: faUserSlash,
          color: '#ed1c24'
        };
      case 'effectué':
        return {
          icon: faCheckCircle,
          color: '#62bb46'
        };
      case 'installé par le client':
        return {
          icon: faUserCheck,
          color: '#414042'
        };

      default:
        return {
          icon: null,
          color: '#000000'
        };
    }
  }
  useEffect(() => {
    const loadSttProgressCounts = async () => {
      const counts = {};
      for (const stt of matchingSTTs) {
        try {
          const response = await fetch(
            `${BASE_API_URL}/activation/stt/${stt.id}/in-progress-count/${activation.Gouvernorat}`
          );
          if (response.ok) {
            const data = await response.json();
            counts[stt.id] = data;
          }

        } catch (error) {
          console.error('Error loading STT progress count:', error);
        }
      }
      setSttProgressCounts(counts);
    };

    if (matchingSTTs.length > 0) {
      loadSttProgressCounts();
    }
  }, [matchingSTTs]);

  const handleMapIconClick = async (e) => {
    e?.stopPropagation();
    setIsMapPopupOpen(true);
    await findMatchingSTTs();
  };

  const handleAssignSTT = async (selectedSTT) => {
    try {
      const requestBody = {
        sttName: selectedSTT.name,
        companyId: selectedSTT.id
      };
      const assignResponse = await fetch(`${BASE_API_URL}/activation/${activation.crm_case}/assign-stt`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log("assign response",assignResponse.status)
      if (assignResponse.status === 200) {
  const result = await assignResponse.json();
  setIsMapPopupOpen(false); 
  if (onAssignmentComplete) onAssignmentComplete();
  return result;
}
      const result = await assignResponse.json();
      return result;

    } catch (error) {
      console.error('Assign STT error:', error);
      setAssignMessage(error.message);
      throw error;
    }
  };

  const handleLinkStt = async (activation) => {
    try {
      if (!activation?.crm_case) {
        throw new Error('CRM case is required');
      }

      const response = await fetch(
        `${BASE_API_URL}/activation/linkSingle?crm=${encodeURIComponent(activation.crm_case)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sttId: activation.sttId,
            sttName: activation.sttName
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to link activation');
      }
  const result = await response.json();
  setIsMapPopupOpen(false);
  if (onAssignmentComplete) onAssignmentComplete(); // Refresh data
  setAssignMessage(`Activation ${activation.crm_case} linked successfully`);
  setTimeout(() => setAssignMessage(null), 4000);
  return result;
    } catch (error) {
      console.error('Link STT error:', error);
      setAssignMessage(error.message);
      throw error;
    }
  };

  const findMatchingSTTs = async () => {
  try {
    const response = await fetch(`${BASE_API_URL}/companies/unblocked`);
    if (!response.ok) throw new Error('Erreur lors de la récupération des STT');
    const sttList = await response.json();

    setAllSTTs(sttList);

    const foundSTTs = [];
    const addedNames = new Set(); // Pour stocker les noms déjà ajoutés

    sttList.forEach(stt => {
      if (
        stt.governorate === activation.Gouvernorat &&
        (stt.delegation === activation.Delegation || !stt.delegation) &&
        !stt.blocked &&
        !addedNames.has(stt.name)
      ) {
        foundSTTs.push({
          ...stt,
          type: 'STT principal',
          companyId: stt.id
        });
        addedNames.add(stt.name); // Marquer ce nom comme ajouté
      }
    });

    sttList.forEach(stt => {
      if (stt.companyDelegations && Array.isArray(stt.companyDelegations)) {
        stt.companyDelegations.forEach(companyDelegation => {
          if (
            companyDelegation &&
            companyDelegation.delegation &&
            companyDelegation.delegation.gouver &&
            !companyDelegation.blocked
          ) {
            const gouverName = companyDelegation.delegation.gouver.name;
            const delegationName = companyDelegation.delegation.name;

            if (
              gouverName.toLowerCase() === activation.Gouvernorat.toLowerCase() &&
              delegationName.toLowerCase() === activation.Delegation.toLowerCase() &&
              !addedNames.has(stt.name)
            ) {
              foundSTTs.push({
                ...stt,
                companyDelegationId: companyDelegation.id,
                delegationName,
                gouvernoratName: gouverName,
                type: 'CompanyDelegation'
              });
              addedNames.add(stt.name);
            }
          }
        });
      }
    });

    setMatchingSTTs(foundSTTs);
    console.log("liste stt non bloquées", foundSTTs);
    return foundSTTs;
  } catch (error) {
    console.error(error);
    setAssignMessage('Erreur lors de la recherche des STT.');
    return [];
  }
};
  return (
    <div className={`activation-item ${isSelected ? 'selected' : ''}`}>
      <div className="activation-item-header">
        <div className="activation-header-left">
          {activation.STATUT.toLowerCase() !== 'abandonnée' && activation.STATUT.toLowerCase() !== 'terminé' && (
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
          )}
          <h3 onClick={onClick} style={{ cursor: 'pointer' }}>
            {activation.crm_case}
          </h3>
        </div>
        <div className="activation-item-msisdn">MSISDN: {activation.MSISDN}</div>
      </div>
      <div className="activation-item-details">
        <p>
          <FontAwesomeIcon icon={faUser} className="icon1" />
          <span>{activation.CLIENT}</span>
        </p>
        <p>
          <FontAwesomeIcon icon={faPhoneAlt} className="icon1" />
          <span>{activation.CONTACT_CLIENT}</span>
        </p>
        <p>
          {(() => {
            const { icon, color } = getStatusIconAndColor(activation.REP_TRAVAUX_STT);
            return icon ? (
              <FontAwesomeIcon icon={icon} size="xl" style={{ color }} />
            ) : null;
          })()}
          <span>{activation.STATUT}
          </span>
        </p>
      </div>
      <div className="buttonItem">
        <div className="activation-item-gouvDel">
          <FontAwesomeIcon icon={faMapMarkerAlt} className="icon2" />
          <span>{activation.Gouvernorat + " , " + activation.Delegation || 'Non affecté'}</span>
        </div>
        <div className="activation-item-stt">
          <p><FontAwesomeIcon icon={faTowerCell} className="icon1" />&nbsp;<span>{activation.NAME_STT ?? "N/A"}</span></p>
        </div>
        <div className="activation-item-cgrps" onClick={handleMapIconClick}>
          <FontAwesomeIcon icon={faMapMarked} className="icon2" />
          <span>{activation.LATITUDE_SITE + " , " + activation.LONGITUDE_SITE || 'CGPS erronées'}</span>
        </div>
      </div>
      <MapPopup
        isOpen={isMapPopupOpen}
        onRequestClose={() => setIsMapPopupOpen(false)}
        latitude={parseFloat(activation.LATITUDE_SITE)}
        longitude={parseFloat(activation.LONGITUDE_SITE)}
        onAssignSTT={handleAssignSTT}
        onLinkSTT={handleLinkStt}
        repTravauxSTT={activation.REP_TRAVAUX_STT}
        statut={activation.STATUT}
        matchingSTTs={matchingSTTs.map(stt => ({
          ...stt,
          progressCount: sttProgressCounts[stt.id] || 0
        }))}
        allSTTs={allSTTs}
      />
      {assignMessage && <p className="assign-message">{assignMessage}</p>}
    </div>
  );
};
export default ActivationItem;