import React, { useState, useEffect } from 'react';
import DpmModal from './DpmModal';
import TransferModal from './TransferModal';
import DatePopup from './DatePopup';

const SubcontractorStockView = ({ 
  companies, 
  selectedSubcontractor, 
  setSelectedSubcontractor,
  fetchPacks,
  ooredooProducts,
  STTProducts,
  onTransferComplete
}) => {
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedDates, setSelectedDates] = useState([]);
  const [formType, setFormType] = useState('pack');
  const [loadingPacks, setLoadingPacks] = useState(false);
  const [packStocks, setPackStocks] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loadingTransfers, setLoadingTransfers] = useState(false);

  const handleSubcontractorChange = (event) => {
    const value = event.target.value;
    setSelectedSubcontractor(value);
    if (value === "") {
      setPackStocks([]);
      setTransfers([]);
    }
  };

  const handleViewByPack = async () => {
    try {
      const selectedCompany = companies.find(company => company.name === selectedSubcontractor);
      if (!selectedCompany) {
        setPackStocks([]);
        return;
      }

      setLoadingPacks(true);
      const response = await fetch(`http://localhost:3000/stock/ByPack/${selectedCompany.id}`);
      const data = await response.json();
      setPackStocks(data);
    } catch (error) {
      console.error("Erreur:", error);
      setPackStocks([]);
    } finally {
      setLoadingPacks(false);
    }
  };

  const handleTransferComplete = () => {
    handleViewByPack();
    fetchTransfers();
  };
  const createTransfer = async (transferData) => {
    try {
      const response = await fetch('http://localhost:3000/stock-movements/transfert/stt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transferData),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors du transfert');
      }
  
      return await response.json();
    } catch (error) {
      console.error("Erreur complète:", error);
      throw error;
    }
  };

  const validateTransfer = async (transferId) => {
    try {
      const response = await fetch(`http://localhost:3000/stock-movements/transfert/${transferId}/validate`, {
        method: 'PUT',
      });
      if (!response.ok) throw new Error('Erreur lors de la validation');
      fetchTransfers(); // Rafraîchir la liste
    } catch (error) {
      console.error("Erreur lors de la validation:", error);
    }
  };

  const cancelTransfer = async (transferId) => {
    try {
      const response = await fetch(`http://localhost:3000/stock-movements/transfert/${transferId}/cancel`, {
        method: 'PUT',
      });
      if (!response.ok) throw new Error('Erreur lors de l\'annulation');
      fetchTransfers(); // Rafraîchir la liste
    } catch (error) {
      console.error("Erreur lors de l'annulation:", error);
    }
  };

  const fetchTransfers = async () => {
    if (!selectedSubcontractor) return;
    
    setLoadingTransfers(true);
    try {
      const selectedCompany = companies.find(c => c.name === selectedSubcontractor);
      if (!selectedCompany) return;

      const response = await fetch(
        `http://localhost:3000/stock-movements/transfert/stt?companyId=${selectedCompany.id}`
      );
      const data = await response.json();
      setTransfers(data);
    } catch (error) {
      console.error("Erreur lors de la récupération des transferts:", error);
    } finally {
      setLoadingTransfers(false);
    }
  };

  useEffect(() => {
    if (selectedSubcontractor && selectedSubcontractor !== "") {
      handleViewByPack();
      fetchTransfers();
    } else {
      setPackStocks([]);
      setTransfers([]);
    }
  }, [selectedSubcontractor]);

  const groupStocksByProduct = (stocks) => {
    if (!stocks) return {};
    return stocks.reduce((acc, stock) => {
      const productId = stock.product.id;
      if (!acc[productId]) {
        acc[productId] = {
          ...stock.product,
          totalQuantity: 0,
          dates: []
        };
      }
      acc[productId].totalQuantity += stock.quantity;
      if (stock.date_prel) {
        acc[productId].dates.push(new Date(stock.date_prel).toLocaleDateString('fr-FR'));
      }
      return acc;
    }, {});
  };

  const handleOpenDpmModal = () => {
    setShowTransferForm(true);
  };

  return (
    <>
      <div className="action-buttons">
        <button
          className="transfer-btn"
          onClick={handleOpenDpmModal}
        >
          DPM
        </button>
        
        <button
  className="transfer-btn"
  onClick={() => setShowTransferModal(true)}
  disabled={!selectedSubcontractor || companies.find(c => c.name === selectedSubcontractor)?.type !== 'sous_traitant'}
>
  Transfert STT
</button>
      </div>

      <div className="subcontractor-selection">
        <label>Choisir un sous-traitant :</label>
        <select 
          onChange={handleSubcontractorChange} 
          value={selectedSubcontractor}
        >
          <option value="">Aucun</option>
          {companies.map(company => (
            <option key={company.id} value={company.name}>
              {company.name}
            </option>
          ))}
        </select>
      </div>

      {selectedSubcontractor && (
        <>
          <div className="product-listOoredoo_stt">
            <table className="product-tableOoredooStt">
              <thead>
                <tr>
                  <th>Pack</th>
                  <th>Description</th>
                  <th>Produits</th>
                </tr>
              </thead>
              <tbody>
                {loadingPacks ? (
                  <tr><td colSpan="3">Chargement des packs...</td></tr>
                ) : packStocks.length === 0 ? (
                  <tr><td colSpan="3">Aucun pack disponible</td></tr>
                ) : (
                  packStocks.map((packData, index) => {
                    const groupedProducts = groupStocksByProduct(packData.stocks);
                    return (
                      <tr key={index}>
                        <td>{packData.pack?.name || 'Inconnu'}</td>
                        <td>{packData.pack?.description || 'Aucune description'}</td>
                        <td>
                          {Object.keys(groupedProducts).length > 0 ? (
                            <table className="sub-table">
                              <thead>
                                <tr>
                                  <th>Nom</th>
                                  <th>Quantité</th>
                                  <th>Référence</th>
                                  <th>Description</th>
                                  <th>Dates de prélèvement</th>
                                </tr>
                              </thead>
                              <tbody>
                                {Object.values(groupedProducts).map((product, idx) => (
                                  <tr key={idx}>
                                    <td>{product.name}</td>
                                    <td>{product.totalQuantity}</td>
                                    <td>{product.reference}</td>
                                    <td>{product.description}</td>
                                    <td>
                                      {product.dates.length === 1 ? (
                                        product.dates[0]
                                      ) : product.dates.length > 1 ? (
                                        <>
                                          {product.dates[0]}
                                          <button 
                                            className="see-more-btn"
                                            onClick={() => {
                                              setSelectedDates(product.dates);
                                              setShowPopup(true);
                                            }}
                                          >
                                            Voir plus
                                          </button>
                                        </>
                                      ) : (
                                        'Aucune date'
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            'Aucun produit dans ce pack'
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="transfers-section">
            <h3>Historique des transferts</h3>
            
            {loadingTransfers ? (
              <p>Chargement des transferts...</p>
            ) : transfers.length === 0 ? (
              <p>Aucun transfert disponible</p>
            ) : (
              <table className="transfers-table">
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th>Quantité</th>
                    <th>De</th>
                    <th>Vers</th>
                    <th>Date</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transfers.map((transfer) => (
                    <tr key={transfer.id}>
                      <td>{transfer.product?.name}</td>
                      <td>{transfer.quantity}</td>
                      <td>{transfer.fromCompany?.name}</td>
                      <td>{transfer.toCompany?.name}</td>
                      <td>{new Date(transfer.createdAt).toLocaleDateString('fr-FR')}</td>
                      <td className={`status-${transfer.etat}`}>
                        {transfer.etat === 0 ? 'En attente' : 
                         transfer.etat === 1 ? 'En RDV' : 
                         transfer.etat === 2 ? 'Terminé' : 'Annulé'}
                      </td>
                      <td>
                        {transfer.etat === 0 && (
                          <>
                            <button 
                              onClick={() => validateTransfer(transfer.id)}
                              className="action-btn validate"
                            >
                              Valider
                            </button>
                            <button 
                              onClick={() => cancelTransfer(transfer.id)}
                              className="action-btn cancel"
                            >
                              Annuler
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {showPopup && (
        <DatePopup 
          selectedDates={selectedDates} 
          setShowPopup={setShowPopup} 
        />
      )}

      {showTransferForm && (
        <DpmModal
          formType={formType}
          setFormType={setFormType}
          setShowTransferForm={setShowTransferForm}
          companies={companies}
          fetchPacks={fetchPacks}
          packs={packStocks.map(p => p.pack)}
          ooredooProducts={ooredooProducts}
          selectedCompanyId={companies.find(c => c.name === selectedSubcontractor)?.id}
          selectedSubcontractor={selectedSubcontractor}
        />
      )}

{showTransferModal && (
  <TransferModal
    companies={companies}
    setShowTransferModal={setShowTransferModal}
    STTProducts={STTProducts}
    selectedCompanyId={companies.find(c => c.name === selectedSubcontractor)?.id}
    createTransfer={createTransfer}
    onTransferComplete={handleTransferComplete}
  />
)}
    </>
  );
};

export default SubcontractorStockView;