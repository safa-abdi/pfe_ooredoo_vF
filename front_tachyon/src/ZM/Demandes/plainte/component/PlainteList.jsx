import React, { useState, useEffect } from 'react';
import PlainteItem from './PlainteItem';
import BatchMapPopup from './BatchMapPopup';
import { message } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckSquare } from '@fortawesome/free-solid-svg-icons';
import './style/plainteList.css'
import { BASE_API_URL } from '../../../../config';

const PlainteList = ({ plaintes, Gouv, isselectedGouv, createdDeleg, onPlainteClick }) => {
  const [selectedplaintes, setSelectedplaintes] = useState([]);
  const [isBatchMapOpen, setIsBatchMapOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // eslint-disable-next-line no-unused-vars
  const [assignMessage, setAssignMessage] = useState('');
  const [, setMatchingSTTs] = useState([]);
  const [isBatchClotureOpen, setIsBatchClotureOpen] = useState(false);
  const [clotureReason, setClotureReason] = useState('');

  const handleDeselectplainte = (plainte) => {
    setSelectedplaintes(prev =>
      prev.filter(a => a.crm_case !== plainte.crm_case)
    );
  };


  const togglePlainteSelection = (plainte) => {
    setSelectedplaintes(prev => {
      const exists = prev.some(a => a.crm_case === plainte.crm_case);
      if (exists) {
        return prev.filter(a => a.crm_case !== plainte.crm_case);
      } else {
        return [...prev, plainte];
      }
    });
  };
  const handleBatchClotureOpen = () => {
    const hasTerminated = selectedplaintes.some(a => a.STATUT.toLowerCase() === 'terminé');

    if (hasTerminated) {
      message.error({
        content: 'Impossible de clôturer des plaintes déjà terminées.',
        duration: 2,
      });
      return;
    }

    setIsBatchClotureOpen(true);
  };
  const handleBatchClotureSubmit = async () => {
    try {
      const plainteIds = selectedplaintes.map(a => a.crm_case);

      const response = await fetch(`${BASE_API_URL}/plainte/batch-cloture-ByZM`, {
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
        setSelectedplaintes([]);
        setClotureReason('');
      }, 2000);
    } catch (error) {
      setErrorMessage(error.message || 'Erreur lors de la clôture');
    }
  };

  const handleBatchMapOpen = async () => {
    if (selectedplaintes.length === 0) {
      setAssignMessage('Veuillez sélectionner au moins une plainte');
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
        const matchesAll = selectedplaintes.every(plainte =>
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
              const delegationMatchesAll = selectedplaintes.every(plainte => {
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
      const plainteIds = selectedplaintes.map(a => a.crm_case);

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

      // Mettre à jour l'état local
      setSuccessMessage(`STT ${selectedSTT.name} affecté avec succès à ${plainteIds.length} plaintes!`);

      // Fermer le popup après 2 secondes
      setTimeout(() => {
        setIsBatchMapOpen(false);
        setSelectedplaintes([]);
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
    if (selectedplaintes.length === plaintes.length) {
      setSelectedplaintes([]);
    } else {
      const plaintesToSelect = plaintes.filter(plainte =>
        plainte.STATUT.toLowerCase() !== 'abandonnée' &&
        plainte.STATUT.toLowerCase() !== 'terminé'
      );
      setSelectedplaintes(plaintesToSelect);
    }
  };
  if (plaintes.length === 0) {
    return <div className="no-plaintes">Aucune plainte effectuée.</div>;
  }

  return (
    <div className="plainte-list">
      <div className="batch-actions">
        <button
          onClick={toggleSelectAll}
          className={`select-all-button ${selectedplaintes.length === plaintes.length ? 'active' : ''
            }`}
          title="Sélectionner/Désélectionner toutes les plaintes"
        >
          <FontAwesomeIcon
            icon={faCheckSquare}
            className={selectedplaintes.length === plaintes.length ? 'icon-active' : ''}
          />
          {selectedplaintes.length === plaintes.length ?
            ' Tout désélectionner' :
            ' Tout sélectionner'}
        </button>
        <button
          onClick={handleBatchClotureOpen}
          disabled={selectedplaintes.length === 0}
          className={`batch-button ${selectedplaintes.length === 0 ? 'disabled' : ''}`}
          title={selectedplaintes.length === 0 ? "Sélectionnez au moins une plainte" : ""}
        >
          Clôturer ({selectedplaintes.length} sélectionnées)
        </button>

        {assignMessage && (
          <div className="assign-message">
            {assignMessage}
          </div>

        )}
        <button
          onClick={handleBatchMapOpen}
          disabled={selectedplaintes.length === 0 || !isselectedGouv}
          className={`batch-button ${selectedplaintes.length === 0 ? 'disabled' :
            !isselectedGouv ? 'no-gouvernorat' : ''
            }`}
          title={
            selectedplaintes.length === 0 ? "Sélectionnez au moins une plainte" :
              !isselectedGouv ? "Sélectionnez un gouvernorat d'abord" : ""
          }
        >
          Affecter ({selectedplaintes.length} sélectionnées)
          {!isselectedGouv && selectedplaintes.length > 0 && (
            <span className="warning-badge"></span>
          )}
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
        <div className="batch-cloture-popup">
          <h2>Clôturer les plaintes</h2>
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

      {plaintes.map((plainte, index) => (
        <PlainteItem
          key={index}
          plainte={plainte}
          isSelected={selectedplaintes.some(a => a.crm_case === plainte.crm_case)}
          onToggleSelect={() => togglePlainteSelection(plainte)}
          onClick={() => onPlainteClick(plainte)}
        />

      ))
      }



      <BatchMapPopup
        isOpen={isBatchMapOpen}
        onRequestClose={() => setIsBatchMapOpen(false)}
        plaintes={selectedplaintes}
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

export default PlainteList;