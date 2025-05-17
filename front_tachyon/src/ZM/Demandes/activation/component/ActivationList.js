import React, { useState, useEffect, use } from 'react';
import ActivationItem from './ActivationItem';
import BatchMapPopup from './BatchMapPopup';
import { message } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckSquare } from '@fortawesome/free-solid-svg-icons';
import './activationList.css'
import { BASE_API_URL } from '../../../../config';

const ActivationList = ({ activations, Gouv, isselectedGouv, createdDeleg, onActivationClick }) => {
  const [selectedActivations, setSelectedActivations] = useState([]);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isBatchMapOpen, setIsBatchMapOpen] = useState(false);
  const [isReassignment, setIsReassignment] = useState(false);
  const [isBatchClotureOpen, setIsBatchClotureOpen] = useState(false);
  const [clotureReason, setClotureReason] = useState('');
  const token = localStorage.getItem("token");
  // console.log(token)
   const user = JSON.parse(localStorage.getItem("user"));
   const userId = user.id;
  // eslint-disable-next-line no-unused-vars
  const [assignMessage, setAssignMessage] = useState('');
  const [matchingSTTs, setMatchingSTTs] = useState([]);
  const handleDeselectActivation = (activation) => {
    setSelectedActivations(prev =>
      prev.filter(a => a.crm_case !== activation.crm_case)
    );
  };

  const handleAssignmentComplete = () => {
  // Cette fonction sera appelée après une affectation réussie
  // Vous pouvez y ajouter une logique de rafraîchissement si nécessaire
  // Par exemple, recharger les données ou afficher un message
  message.success('Affectation réussie !');
};
    const handleBatchClotureOpen = () => {
      console.log("on batch cloture")
      const hasTerminated = selectedActivations.some(a => a.STATUT.toLowerCase() === 'terminé');
  
      if (hasTerminated) {
        message.error({
          content: 'Impossible de clôturer des resiliations déjà terminées.',
          duration: 2,
        });
        return;
      }
  
      setIsBatchClotureOpen(true);
    };

  useEffect(() => {
    if (!isselectedGouv && selectedActivations.length > 0) {
      setSelectedActivations([]);
      message.warning({
        content: 'Veuillez sélectionner une gouvernorat',
        duration: 2,
        icon: <ExclamationCircleFilled />,
      });
    }
  }, [isselectedGouv, selectedActivations.length]);
  useEffect(() => {
    setSelectedActivations([]);
  }, [activations]);
  const toggleActivationSelection = (activation) => {
    setSelectedActivations(prev => {
      const exists = prev.some(a => a.crm_case === activation.crm_case);
      if (exists) {
        return prev.filter(a => a.crm_case !== activation.crm_case);
      } else {
        return [...prev, activation];
      }
    });
  };

  const handleBatchMapOpen = async () => {
    if (selectedActivations.length === 0) {
      setAssignMessage('Veuillez sélectionner au moins une activation');
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

  const handleReassignBatchMapOpen = () => {
    setIsReassignment(true);
    setIsBatchMapOpen(true);
  };

  const findCommonSTTs = async () => {
    try {
      const response = await fetch(`${BASE_API_URL}/companies/unblocked`);
      if (!response.ok) throw new Error('Erreur lors de la récupération des STT');

      const sttList = await response.json();
      const commonSTTs = [];

      sttList.forEach(stt => {
        if (stt.companyDelegations && Array.isArray(stt.companyDelegations)) {
          stt.companyDelegations.forEach(companyDelegation => {
            if (companyDelegation && companyDelegation.delegation && companyDelegation.delegation.gouver) {
              const delegationMatchesAll = selectedActivations.every(activation => {
                const governorateMatch = companyDelegation.delegation.gouver.name === activation.Gouvernorat;
                const delegationMatch = companyDelegation.delegation.name === activation.Delegation;
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
    const activationIds = selectedActivations.map((a) => a.crm_case);
    
    
    const response = await fetch(`${BASE_API_URL}/activation/batch-assign-stt/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        activationIds,
        sttName: selectedSTT.name,
        companyId: selectedSTT.id,
      }),
    });

    if (!response.ok) {
      throw new Error("Erreur lors de l'affectation du STT");
    }
    const result = await response.json();
    setTimeout(() => {
      setIsBatchMapOpen(false);
      setSelectedActivations([]);
    }, 2000);
  } catch (error) {
    setErrorMessage(error.message || "Erreur lors de l'affectation du STT");
  }
};

 const handleBatchClotureSubmit = async () => {
    try {
      const activationIds = selectedActivations.map(a => a.crm_case);

      const response = await fetch(`${BASE_API_URL}/activation/batch-cloture-ByZM/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activationIds,
          note: clotureReason,
        }),
      });

      if (!response.ok) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        throw new Error('Erreur lors de la clôture des activations');
      }
      setSuccessMessage(`Clôture réussie pour ${activationIds.length} plaintes !`);
      setTimeout(() => {
        setIsBatchClotureOpen(false);
        setSelectedActivations([]);
        setClotureReason('');
      }, 2000);
    } catch (error) {
      setErrorMessage(error.message || 'Erreur lors de la clôture');
    }
  };
  const handleLinkAssign = async (activation) => {
    try {
      const response = await fetch(
        `${BASE_API_URL}/activation/linkSingle?crm=${activation.crm_case}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to link activation');
      }

      return await response.json();
    } catch (error) {
      console.error('Link activation error:', error);
      throw error;
    }
  };
  const isNonAffecte = (value) => {
    return value?.toLowerCase().trim() === "non_affecté_stt";
  };
  const handleReassign = async (selectedSTT) => {
    try {
      const activationIds = selectedActivations.map(a => a.crm_case);

      const response = await fetch(`${BASE_API_URL}/activation/batch-reassign-stt`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activationIds,
          sttName: selectedSTT.name,
          companyId: selectedSTT.id
        }),
      });


      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erreur lors de la réaffectation');
      }

      const result = await response.json();
      return result;

    } catch (error) {
      console.error('Erreur de réaffectation:', error);
      setErrorMessage(`Erreur: ${error.message}`);
      setTimeout(() => setErrorMessage(null), 3000);
      throw error;
    }
  };
  const toggleSelectAll = () => {
    if (selectedActivations.length === activations.length) {
      setSelectedActivations([]);
    } else {
      const activationsToSelect = activations.filter(activation =>
        activation.STATUT.toLowerCase() !== 'abandonnée' &&
        activation.STATUT.toLowerCase() !== 'terminé'
      );
      setSelectedActivations(activationsToSelect);
    }
  };
  if (activations.length === 0) {
    return <div className="no-activations">Aucune activation effectuée.</div>;
  }
  return (
    <div className="activation-list">
      <div className="batch-actions">
        <button
          onClick={toggleSelectAll}
          className={`select-all-button ${selectedActivations.length === activations.length ? 'active' : ''
            }`}
          title="Sélectionner/Désélectionner toutes les activations"
        >
          <FontAwesomeIcon
            icon={faCheckSquare}
            className={selectedActivations.length === activations.length ? 'icon-active' : ''}
          />
          {selectedActivations.length === activations.length ?
            ' Tout désélectionner' :
            ' Tout sélectionner'}
        </button>

        {assignMessage && (
          <div className="assign-message">
            {assignMessage}
          </div>

        )}
        <button
          onClick={handleBatchClotureOpen}
          disabled={selectedActivations.length === 0}
          className={`batch-button ${selectedActivations.length === 0 ? 'disabled' : ''}`}
          title={selectedActivations.length === 0 ? "Sélectionnez au moins une activation" : ""}
        >
          Clôturer ({selectedActivations.length} sélectionnées)
        </button>

        <button
          onClick={handleBatchMapOpen}
          disabled={!isselectedGouv || selectedActivations.some(a =>
            a.STATUT !== "En cours" || !isNonAffecte(a.REP_TRAVAUX_STT)
          )}
        >
          Affectation ({selectedActivations.filter(a => a.STATUT === "En cours" && isNonAffecte(a.REP_TRAVAUX_STT)).length} sélectionnées)
        </button>
        <button
          onClick={handleReassignBatchMapOpen}
          disabled={!isselectedGouv || selectedActivations.some(a =>
            a.STATUT !== "En cours" || isNonAffecte(a.REP_TRAVAUX_STT)
          )}
        >
          Réaffectation ({selectedActivations.filter(a => a.STATUT === "En cours" && !isNonAffecte(a.REP_TRAVAUX_STT)).length} sélectionnées)
        </button>
      </div>
        {isBatchClotureOpen && (
        <div className="batch-clotureAct-popup">
          <h2>Clôturer les Activations</h2>
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
      {activations.map((activation, index) => (
        <ActivationItem
          key={index}
          activation={activation}
          isSelected={selectedActivations.some(a => a.crm_case === activation.crm_case)}
          onToggleSelect={() => toggleActivationSelection(activation)}
          onClick={() => onActivationClick(activation)}
          onReassign={
            activation.STATUT === "En cours" &&
              activation["REP travaux"] !== "non_affecté_stt"
              ? () => handleReassign(activation)
              : null
          }
            onAssignmentComplete={handleAssignmentComplete}


        />
      ))}
      <BatchMapPopup
        isOpen={isBatchMapOpen}
        onRequestClose={() => setIsBatchMapOpen(false)}
        activations={selectedActivations}
        onAssignSTT={handleBatchAssign}
        onDeselect={handleDeselectActivation}
        Gouv={Gouv}
        isselectedGouv={isselectedGouv}
        createdDeleg={createdDeleg}
        onLinkSTT={handleLinkAssign}
        successMessage={successMessage}
        errorMessage={errorMessage}
        setSuccessMessage={setSuccessMessage}
        setErrorMessage={setErrorMessage}
        isReassignment={isReassignment}
        onSuccess={activations}
      />
    </div>
  );
};

export default ActivationList;