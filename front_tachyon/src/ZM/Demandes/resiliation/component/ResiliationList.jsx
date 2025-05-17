import React, { useState, useEffect } from 'react';
import ResiliationItem from './ResiliationItem';
import BatchMapPopup from './BatchMapPopup';
import { message } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckSquare } from '@fortawesome/free-solid-svg-icons';
import '../styles/resiliationList.css'
import { BASE_API_URL } from '../../../../config';

const ResiliationList = ({ resiliations, Gouv, isselectedGouv, createdDeleg, onResiliationClick }) => {
  const [selectedresiliations, setSelectedresiliations] = useState([]);
  const [isBatchMapOpen, setIsBatchMapOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const [assignMessage, setAssignMessage] = useState('');
  const [, setMatchingSTTs] = useState([]);
  const [isBatchClotureOpen, setIsBatchClotureOpen] = useState(false);
  const [clotureReason, setClotureReason] = useState('');
  const [isReassignment, setIsReassignment] = useState(false);

  const handleDeselectplainte = (resiliation) => {
    setSelectedresiliations(prev =>
      prev.filter(a => a.crm_case !== resiliation.crm_case)
    );
  };
  console.log('Received resiliation data:', resiliations);


  const togglePlainteSelection = (resiliation) => {
    setSelectedresiliations(prev => {
      const exists = prev.some(a => a.crm_case === resiliation.crm_case);
      if (exists) {
        return prev.filter(a => a.crm_case !== resiliation.crm_case);
      } else {
        return [...prev, resiliation];
      }
    });
  };
  const handleBatchClotureOpen = () => {
    const hasTerminated = selectedresiliations.some(a => a.STATUT.toLowerCase() === 'terminé');

    if (hasTerminated) {
      message.error({
        content: 'Impossible de clôturer des resiliations déjà terminées.',
        duration: 2,
      });
      return;
    }

    setIsBatchClotureOpen(true);
  };
  const handleReassignBatchMapOpen = () => {
    setIsReassignment(true);
    setIsBatchMapOpen(true);
  };

  const handleBatchClotureSubmit = async () => {
    try {
      const plainteIds = selectedresiliations.map(a => a.crm_case);

      const response = await fetch(`${BASE_API_URL}/resiliation/batch-cloture-ByZM`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plainteIds,
          note: clotureReason,
        }),
      });

      if (!response.ok) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        throw new Error('Erreur lors de la clôture des plaintes');
      }
      setSuccessMessage(`Clôture réussie pour ${plainteIds.length} plaintes !`);
      setTimeout(() => {
        setIsBatchClotureOpen(false);
        setSelectedresiliations([]);
        setClotureReason('');
      }, 2000);
    } catch (error) {
      setErrorMessage(error.message || 'Erreur lors de la clôture');
    }
  };
  const isNonAffecte = (value) => {
    return value?.toLowerCase().trim() === "non_affecté_stt";
  };
  const handleBatchMapOpen = async () => {
    if (selectedresiliations.length === 0) {
      setAssignMessage('Veuillez sélectionner au moins une resiliation');
      setTimeout(() => setAssignMessage(''), 2000);
      return;
    }
    if (!isselectedGouv) {
      message.warning({
        content: 'Veuillez sélectionner une gouvernorat',
        duration: 2,
        icon: <ExclamationCircleFilled />,
      });

      return;
    }
    setIsReassignment(false);
    setIsBatchMapOpen(true);
    await findCommonSTTs();
  };



  const findCommonSTTs = async () => {
    try {
      const response = await fetch(`${BASE_API_URL}/companies/unblocked`);
      if (!response.ok) throw new Error('Erreur lors de la récupération des STT');

      const sttList = await response.json();
      const commonSTTs = [];

      sttList.forEach(stt => {
        const matchesAll = selectedresiliations.every(plainte =>
          stt.governorate === plainte.Gouvernorat &&
          (stt.delegation === plainte.Delegation || !stt.delegation) &&
          !stt.blocked
        );

        if (matchesAll) {
          commonSTTs.push({
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
              const delegationMatchesAll = selectedresiliations.every(plainte => {
                const governorateMatch = companyDelegation.delegation.gouver.name === plainte.Gouvernorat;
                const delegationMatch = companyDelegation.delegation.name === plainte.Delegation;
                return governorateMatch && delegationMatch && !companyDelegation.blocked;
              });

              if (delegationMatchesAll) {
                commonSTTs.push({
                  ...companyDelegation,
                  type: 'CompanyDelegation',
                  parentSTT: stt.name,
                  parentCompanyId: stt.id,
                  id: companyDelegation.id,
                  companyId: stt.id,
                  delegationName: companyDelegation.delegation.name,
                  gouvernoratName: companyDelegation.delegation.gouver.name
                });
              }
            }
          });
        }
      });
      console.log('common stt', commonSTTs)
      setMatchingSTTs(commonSTTs);
    } catch (error) {
      console.error(error);
      setAssignMessage('Erreur lors de la recherche des STT.');
    }
  };
  const handleBatchAssign = async (selectedSTT) => {
    try {
      const plainteIds = selectedresiliations.map(a => a.crm_case);

      const response = await fetch(`${BASE_API_URL}/plainte/batch-assign-stt`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plainteIds,
          sttName: selectedSTT.name,
          companyId: selectedSTT.id
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'affectation du STT');
      }

      setSuccessMessage(`STT ${selectedSTT.name} affecté avec succès à ${plainteIds.length} resiliations!`);
      setTimeout(() => {
        setIsBatchMapOpen(false);
        setSelectedresiliations([]);
      }, 2000);

    } catch (error) {
      setErrorMessage(error.message || 'Erreur lors de l\'affectation du STT');
    }
  };
  const handleLinkAssign = async (plainte) => {
    try {
      const response = await fetch(
        `${BASE_API_URL}/plainte/linkSingle?crm=${plainte.crm_case}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to link plainte');
      }

      return await response.json();
    } catch (error) {
      console.error('Link plainte error:', error);
      throw error;
    }
  };

  const toggleSelectAll = () => {
  const eligibleResiliations = resiliations.filter(plainte =>
    plainte.STATUT.toLowerCase() !== 'abandonnée' &&
    plainte.STATUT.toLowerCase() !== 'terminé'
  );
  
  const allEligibleSelected = eligibleResiliations.every(eligible => 
    selectedresiliations.some(selected => selected.crm_case === eligible.crm_case)
  );

  if (allEligibleSelected) {
    setSelectedresiliations([]);
  } else {
    setSelectedresiliations(eligibleResiliations);
  }
};
  if (!Array.isArray(resiliations) || resiliations.length === 0) {
    return <div className="no-resiliations">Aucune plainte effectuée.</div>;
  }

  return (
    <div className="resiliation-list">
      <div className="batchRes-actions">
        <button
          onClick={toggleSelectAll}
          className={`select-all-buttonRes ${selectedresiliations.length === resiliations.length ? 'active' : ''
            }`}
          title="Sélectionner/Désélectionner toutes les resiliations"
        >
          <FontAwesomeIcon
            icon={faCheckSquare}
            className={selectedresiliations.length === resiliations.length ? 'icon-active' : ''}
          />
          {selectedresiliations.length === resiliations.length ?
            ' Tout désélectionner' :
            ' Tout sélectionner'}
        </button>
        <button
          onClick={handleBatchClotureOpen}
          disabled={selectedresiliations.length === 0}
          className={`batchRes-button ${selectedresiliations.length === 0 ? 'disabled' : ''}`}
          title={selectedresiliations.length === 0 ? "Sélectionnez au moins une plainte" : ""}
        >
          Clôturer ({selectedresiliations.length} sélectionnées)
        </button>

        {assignMessage && (
          <div className="assign-message">
            {assignMessage}
          </div>

        )}
        <button
          onClick={handleBatchMapOpen}
          disabled={!isselectedGouv || selectedresiliations.some(a =>
            a.STATUT !== "En cours" || !isNonAffecte(a.REP_TRAVAUX_STT)
          )}
        >
          Affectation ({selectedresiliations.filter(a => a.STATUT === "En cours" && isNonAffecte(a.REP_TRAVAUX_STT)).length} sélectionnées)
        </button>
        <button
          onClick={handleReassignBatchMapOpen}
          disabled={!isselectedGouv || selectedresiliations.some(a =>
            a.STATUT !== "En cours" || isNonAffecte(a.REP_TRAVAUX_STT)
          )}
        >
          Réaffectation ({selectedresiliations.filter(a => a.STATUT === "En cours" && !isNonAffecte(a.REP_TRAVAUX_STT)).length} sélectionnées)
        </button>
      </div>
      {successMessage && (
        <div className="success-message">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="error-message">
          {errorMessage}
        </div>
      )}
      {isBatchClotureOpen && (
        <div className="batchRes-cloture-popup">
          <h2>Clôturer les résiliations</h2>
          <textarea
            value={clotureReason}
            onChange={(e) => setClotureReason(e.target.value)}
            placeholder="Entrez la raison de la clôture..."
            rows={4}
            style={{ width: '100%', marginBottom: '10px' }}
          />
          <div className="popup-actions">
            <button onClick={handleBatchClotureSubmit} disabled={!clotureReason.trim()}>
              Confirmer Clôture
            </button>
            <button onClick={() => setIsBatchClotureOpen(false)}>
              Annuler
            </button>
          </div>
        </div>
      )}

      {resiliations.map((plainte, index) => (
        <ResiliationItem
          key={index}
          plainte={plainte}
          isSelected={selectedresiliations.some(a => a.crm_case === plainte.crm_case)}
          onToggleSelect={() => togglePlainteSelection(plainte)}
          onClick={() => onResiliationClick(plainte)}
        />
      ))
      }

      <BatchMapPopup
        isOpen={isBatchMapOpen}
        onRequestClose={() => setIsBatchMapOpen(false)}
        resiliations={selectedresiliations}
        onAssignSTT={handleBatchAssign}
        onDeselect={handleDeselectplainte}
        Gouv={Gouv}
        isselectedGouv={isselectedGouv}
        createdDeleg={createdDeleg}
        onLinkSTT={handleLinkAssign}
        successMessage={successMessage}
        errorMessage={errorMessage}
        setSuccessMessage={setSuccessMessage}
        setErrorMessage={setErrorMessage}
      />
    </div>
  );
};

export default ResiliationList;