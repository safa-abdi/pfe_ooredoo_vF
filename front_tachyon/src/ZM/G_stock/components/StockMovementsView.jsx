import React, { useState, useEffect } from 'react';
import ConfirmationModal from './ConfirmationModal';
import StockFilters from './StockFilters';
import RDVModal from './RDVModal';

const StockMovementsView = ({
  allcompanies,
  filterEmetteur,
  setFilterEmetteur,
  filterRecepteur,
  setFilterRecepteur,
  filterDate,
  setFilterDate,
  filterState,
  setFilterState,
  fetchStockData,
  filterMvtType,
  setFilterMvtType,
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRDVModal, setShowRDVModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [prelevDate, setPrelevDate] = useState('');
  const [groupedMovements, setGroupedMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:3000/stock-movements/grouped-by-bon-optimized');

        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const data = await response.json();
        setGroupedMovements(data);
      } catch (err) {
        console.error("Erreur:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredGroups = groupedMovements.filter(group => {
    return group.movements.some(movement => {
      const matchesEmetteur = !filterEmetteur || 
        (movement.fromCompany?.name?.toLowerCase() === filterEmetteur.toLowerCase());
      
      const matchesRecepteur = !filterRecepteur || 
        (movement.toCompany?.name?.toLowerCase() === filterRecepteur.toLowerCase());
      
      const matchesState = filterState === "" || 
        movement.etat === Number(filterState);
      
      const matchesDate = !filterDate || 
        (movement.date_dpm && new Date(movement.date_dpm).toISOString().split('T')[0] === filterDate);
      
      const matchesMvtType = !filterMvtType || 
        (movement.movement_type?.toLowerCase() === filterMvtType.toLowerCase());
      
      return matchesEmetteur && matchesRecepteur && matchesState && matchesDate && matchesMvtType;
    });
  });

  const handleValidateGroup = (group) => {
    setSelectedGroup(group);
    setShowConfirmModal(true);
  };

  const handleCancelGroup = (group) => {
    setSelectedGroup(group);
    setShowCancelModal(true);
  };

  const handleSetGroupRDV = (group) => {
    setSelectedGroup(group);
    setShowRDVModal(true);
  };

  const confirmCancelGroup = async () => {
    if (!selectedGroup) return;

    try {
      setLoading(true);
      const responses = await Promise.all(
        selectedGroup.movements
          .filter(m => m.etat === 0)
          .map(movement =>
            fetch(`http://localhost:3000/stock-movements/${movement.id}/cancel`, {
              method: 'PATCH',
            })
          )
      );

      if (responses.every(r => r.ok)) {
        const updatedResponse = await fetch('http://localhost:3000/stock-movements/grouped-by-bon-optimized');
        const updatedData = await updatedResponse.json();
        setGroupedMovements(updatedData);
        await fetchStockData();
        setShowCancelModal(false);
      }
    } catch (error) {
      console.error("Erreur:", error);
      setApiError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmRDV = async () => {
    if (!selectedGroup || !pdfFile || !prelevDate) {
      setApiError('Please fill all fields');
      return;
    }

    try {
      setLoading(true);
      setApiError(null);

      const formData = new FormData();
      formData.append('pdf', pdfFile);
      formData.append('date_rdv', prelevDate);

      const response = await fetch(
        `http://localhost:3000/stock-movements/rdv-dpm-group/${selectedGroup.bon}`,
        {
          method: 'PATCH',
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to schedule RDV');
      }

      const updatedResponse = await fetch('http://localhost:3000/stock-movements/grouped-by-bon-optimized');
      const updatedData = await updatedResponse.json();
      setGroupedMovements(updatedData);

      setShowRDVModal(false);
      setPdfFile(null);
      setPrelevDate('');

    } catch (error) {
      console.error("Error:", error);
      setApiError(error.message);
    } finally {
      setLoading(false);
    }
  };
  const confirmPrelev = async () => {
    if (!selectedGroup) return;

    try {
      setLoading(true);

      const payload = {
        date_prelevement: prelevDate,
        movements_ids: selectedGroup.movements
          .filter(m => m.etat === 1)
          .map(m => m.id)
      };

      // Appel API
      const response = await fetch(
        'http://localhost:3000/stock-movements/validate-group',
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la validation');
      }

      // Rafraîchir les données
      const updatedResponse = await fetch('http://localhost:3000/stock-movements/grouped-by-bon-optimized');
      const updatedData = await updatedResponse.json();
      setGroupedMovements(updatedData);

      setShowConfirmModal(false);
      setPrelevDate('');

    } catch (error) {
      console.error("Erreur:", error);
      setApiError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Chargement en cours...</div>;
  if (error) return <div className="error">Erreur: {error}</div>;

  return (
    <>
      <StockFilters
        allcompanies={allcompanies}
        filterEmetteur={filterEmetteur}
        setFilterEmetteur={setFilterEmetteur}
        filterRecepteur={filterRecepteur}
        setFilterRecepteur={setFilterRecepteur}
        filterDate={filterDate}
        setFilterDate={setFilterDate}
        filterState={filterState}
        setFilterState={setFilterState}
        filterMvtType={filterMvtType}
        setFilterMvtType={setFilterMvtType}
    
      />

      {apiError && <div className="alert alert-danger">{apiError}</div>}

      <div>
        {filteredGroups.map(group => (
          <div key={group.bon} className="bon-group">
            <div className="bon-header">
              <h3>Bon : {group.bon}</h3>
              <div className="group-actions">
                {group.movements.length > 0 && group.movements.every(m => m.etat === 1) && (
                  <button
                    onClick={() => handleValidateGroup(group)}
                    className="btn btn-success validate-bon-btn"
                    disabled={loading}
                  >
                    Valider le bon
                  </button>
                )}

                {group.movements.some(m => m.etat === 0) && (
                  <>
                    <button
                      onClick={() => handleCancelGroup(group)}
                      className="btn btn-danger cancel-group-btn"
                      disabled={loading}
                    >
                      Annuler le bon
                    </button>
                    {group.movements.some(m => m.movement_type === 'DPM') && (

                    <button
                      onClick={() => handleSetGroupRDV(group)}
                      className="btn btn-primary rdv-group-btn"
                      disabled={loading}
                    >
                      Planifier RDV
                    </button>
                       )}
                  </>
                )}
              </div>
            </div>

            <table className="table movements-table">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Référence</th>
                  <th>Quantité</th>
                  <th>État</th>
                  <th>Type Mouvement</th>
                  <th>De</th>
                  <th>À</th>
                  <th>Date Mouvement</th>
                  {group.movements.some(m => m.etat === 1 || m.etat === 2 || m.etat === 4) && <th>Date RDV</th>}
                  {group.movements.some(m => m.etat === 2 || m.etat === 4) && <th>Date Prélèvement</th>}
                  {group.movements.some(m => m.etat === 4 && m.taux_exces !== 0) && <th>Taux exces </th>}
                  {group.movements.some(m => m.etat === 4 && m.taux_deficit !== 0) && <th>Taux deficit </th>}
                </tr>
              </thead>
              <tbody>
                {group.movements.map(movement => (
                  <tr key={movement.id}>
                    <td>{movement.product?.name || 'Inconnu'}</td>
                    <td>{movement.product?.reference || 'N/A'}</td>
                    <td>{movement.quantity}</td>
                    <td className={`state_Bdd-${movement.etat}`}>
                      <span className={`badge-state_Bdd-${movement.etat}`}>
                        {['En attente', 'En RDV', 'Terminé', 'Annulé' ,'Partiellement_terminé'][movement.etat]}
                      </span>
                    </td>
                    <td>{movement.movement_type || 'Inconnu'}</td>

                    <td>{movement.fromCompany?.name || 'Inconnu'}</td>
                    <td>{movement.toCompany?.name || 'Inconnu'}</td>
                    <td>
                      {movement.date_dpm ? new Date(movement.date_dpm).toLocaleDateString('fr-FR') : 'Inconnu'}
                    </td>
                    {group.movements.some(m => m.etat === 1 || m.etat === 2 || m.etat === 4) && (
                      <td>
                        {(movement.etat === 1 || movement.etat === 2 || movement.etat === 4) && movement.date_rdv
                          ? new Date(movement.date_rdv).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                          : '-'}
                      </td>
                    )}
                    {group.movements.some(m => m.etat === 2 || m.etat === 4) && (
                      <td>
                        {(movement.etat === 2 || movement.etat === 4) && movement.date_prelev
                          ? new Date(movement.date_prelev).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                          : '-'}
                      </td>
                    )}
                    {group.movements.some(m => m.etat === 4 && m.taux_exces !== 0) && (
                      <td>
                        {(movement.etat === 4 || movement.taux_exces !== 0)
                          ? (movement.taux_exces)
                          : '-'}
                      </td>
                    )}
                    {group.movements.some(m => m.etat === 4 && m.taux_deficit !== 0) && (
                      <td className='deficit'>
                        {(movement.etat === 4 || movement.taux_deficit !== 0) 
                          ? (movement.taux_deficit)
                          : '-'}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      <ConfirmationModal
        show={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmPrelev}
        title={`Confirmer validation du bon ${selectedGroup?.bon}`}
        message="Êtes-vous sûr de vouloir valider tous les produits de ce bon ?"
        showDateInput
        dateValue={prelevDate}
        setDateValue={setPrelevDate}
        loading={loading}
      />

      <ConfirmationModal
        show={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={confirmCancelGroup}
        title={`Confirmer annulation du bon ${selectedGroup?.bon}`}
        message="Êtes-vous sûr de vouloir annuler tous les produits de ce bon ?"
        confirmText="Confirmer l'annulation"
        loading={loading}
      />

      <RDVModal
        show={showRDVModal}
        onClose={() => {
          setShowRDVModal(false);
          setApiError(null);
        }}
        onConfirm={confirmRDV}
        title={`Planifier RDV pour le bon ${selectedGroup?.bon}`}
        message="Veuillez sélectionner une date et un fichier PDF à envoyer"
        dateValue={prelevDate}
        setDateValue={setPrelevDate}
        pdfFile={pdfFile}
        setPdfFile={setPdfFile}
        loading={loading}
        error={apiError}
      />
    </>
  );
};

export default StockMovementsView;