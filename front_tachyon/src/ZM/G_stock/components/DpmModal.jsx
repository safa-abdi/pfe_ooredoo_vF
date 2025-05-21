import React, { useState, useEffect } from 'react';

const DpmModal = ({
  setShowTransferForm,
  companies,
  fetchPacks,
  selectedSubcontractor,
  ooredooProducts
}) => {
  const [selectedPacks, setSelectedPacks] = useState([]);
  const [dpmQuantities, setDpmQuantities] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [availableQuantities, setAvailableQuantities] = useState({});
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [packs, setPacks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [packStockDetails, setPackStockDetails] = useState({});
  const [N_Bon_Enlévement_DPM, setN_Bon_Enlévement_DPM] = useState('');
  const [activeTab, setActiveTab] = useState('packs'); // 'packs' ou 'products'

  // Chargement initial des données
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        const quantitiesMap = {};
        ooredooProducts.forEach(item => {
          quantitiesMap[item.product.id] = item.DPM_quantity;
        });
        setAvailableQuantities(quantitiesMap);

        // Chargement des packs
        const packsResponse = await fetch('http://localhost:3000/packs');
        const packsData = await packsResponse.json();
        setPacks(packsData);

      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        setErrorMessage("Erreur lors du chargement des données");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [ooredooProducts]);

  useEffect(() => {
    const newPackDetails = {};

    selectedPacks.forEach(packId => {
      const pack = packs.find(p => p.id === parseInt(packId));
      if (pack) {
        newPackDetails[packId] = pack.products.map(product => ({
          ...product,
          availableQuantity: availableQuantities[product.id] || 0
        }));
      }
    });

    setPackStockDetails(newPackDetails);
  }, [selectedPacks, packs, availableQuantities]);


  const handlePackSelection = (packId, isSelected) => {
    if (isSelected) {
      setSelectedPacks(prev => [...prev, packId]);
      setDpmQuantities(prev => ({ ...prev, [packId]: 1 }));
    } else {
      setSelectedPacks(prev => prev.filter(id => id !== packId));
      const newQuantities = { ...dpmQuantities };
      delete newQuantities[packId];
      setDpmQuantities(newQuantities);

      const newPackDetails = { ...packStockDetails };
      delete newPackDetails[packId];
      setPackStockDetails(newPackDetails);
    }
  };

  const handlePackQuantityChange = (packId, quantity) => {
    setDpmQuantities(prev => ({
      ...prev,
      [packId]: Math.max(1, parseInt(quantity) || 1)
    }));
  };

  const handleProductSelection = (productId, quantity) => {
    setSelectedProducts(prev => {
      const existingIndex = prev.findIndex(p => p.id === productId);
      if (existingIndex >= 0) {
        if (quantity > 0) {
          const updated = [...prev];
          updated[existingIndex].quantity = quantity;
          return updated;
        } else {
          return prev.filter(p => p.id !== productId);
        }
      } else {
        if (quantity > 0) {
          const product = ooredooProducts.find(p => p.product.id === productId);
          return [
            ...prev,
            {
              id: productId,
              name: product.product.name,
              quantity: quantity
            }
          ];
        }
        return prev;
      }
    });
  };

  const refreshData = async () => {
    try {
      setIsLoading(true);

      const newQuantities = {};
      ooredooProducts.forEach(item => {
        newQuantities[item.product.id] = item.quantity;
      });
      setAvailableQuantities(newQuantities);

      const packsResponse = await fetch('http://localhost:3000/packs');
      const packsData = await packsResponse.json();
      setPacks(packsData);

      if (fetchPacks) {
        await fetchPacks();
      }

    } catch (error) {
      console.error("Erreur lors du rafraîchissement:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDPM = async () => {
    try {
      if (!selectedCompanyId) {
        setErrorMessage("Veuillez sélectionner une STT destinataire.");
        return;
      }

      if (!N_Bon_Enlévement_DPM) {
        setErrorMessage("Veuillez saisir le numéro de bon d'enlèvement.");
        return;
      }

      setIsLoading(true);

      if (selectedPacks.length === 0 && selectedProducts.length === 0) {
        setErrorMessage("Veuillez sélectionner au moins un pack ou un produit.");
        setIsLoading(false);
        return;
      }

      const packStockErrors = [];
      selectedPacks.forEach(packId => {
        const quantity = dpmQuantities[packId] || 1;
        const specificProductRef = "15.02.01.01.0005";
        
        packStockDetails[packId]?.forEach(product => {
            if (product.reference === specificProductRef) {
                if ((availableQuantities[product.id] || 0) < quantity) {
                    packStockErrors.push(
                        `Pack ${packs.find(p => p.id === parseInt(packId))?.name}: ` +
                        `Stock insuffisant pour ${product.name} ` +
                        `(${availableQuantities[product.id] || 0} disponible, ${quantity} demandé)`
                    );
                }
            }
        });
    });

      const productStockErrors = selectedProducts
        .filter(product => (availableQuantities[product.id] || 0) < product.quantity)
        .map(product => `${product.name} (${availableQuantities[product.id] || 0} disponible, ${product.quantity} demandé)`);

      const allStockErrors = [...packStockErrors, ...productStockErrors];
      if (allStockErrors.length > 0) {
        throw new Error(`Stocks insuffisants:\n${allStockErrors.join('\n')}`);
      }

      const packPromises = selectedPacks.map(packId =>
        fetch('http://localhost:3000/stock-movements/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pack_id: packId,
            quantity: dpmQuantities[packId] || 1,
            N_Bon_Enlévement_DPM: N_Bon_Enlévement_DPM,
            from_company_id: 1,
            to_company_id: selectedCompanyId,
            movement_type: "DPM",
            etat: 0
          })
        })
      );

      const productPromises = selectedProducts.map(product =>
        fetch('http://localhost:3000/stock-movements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product_id: product.id,
            quantity: product.quantity,
            N_Bon_Enlévement_DPM: N_Bon_Enlévement_DPM,
            from_company_id: 1,
            to_company_id: selectedCompanyId,
            movement_type: "DPM",
            etat: 0
          })
        })
      );

      const responses = await Promise.all([...packPromises, ...productPromises]);
      if (!responses.every(r => r.ok)) {
        throw new Error("Certains mouvements n'ont pas pu être créés");
      }

      await refreshData();
      setSelectedPacks([]);
      setSelectedProducts([]);
      setDpmQuantities({});
      setN_Bon_Enlévement_DPM('');
      setErrorMessage('');

      alert("DPM créé avec succès !");
      setShowTransferForm(false);
      await fetchPacks();

    } catch (error) {
      console.error("Erreur:", error);
      setErrorMessage(error.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="transfer-modal">
      <div className="transfer-content">
        <h2>Créer DPM</h2>

        <div className="form-group">
          <label>Sélectionnez la STT destinataire:</label>
          <select
            value={selectedCompanyId}
            onChange={(e) => {
              setSelectedCompanyId(e.target.value);
              setSelectedPacks([]);
              setSelectedProducts([]);
            }}
            disabled={isLoading}
          >
            <option value="">Choisissez une STT</option>
            {companies
              .filter(company => company.id !== 1)
              .map(company => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
          </select>
        </div>

        {selectedCompanyId && (
          <>
            <div className="tabs">
              <button
                className={`action-btn tab-button ${activeTab === 'packs' ? 'active' : ''}`}
                onClick={() => setActiveTab('packs')}
              >
                Packs
              </button>
              &nbsp;
              <button
                className={`action-btn tab-button ${activeTab === 'products' ? 'active' : ''}`}
                onClick={() => setActiveTab('products')}
              >
                Produits
              </button>
            </div>

            <div className="tab-content">
              {activeTab === 'packs' && (
                <div className="pack-selection">
                  {isLoading ? (
                    <p>Chargement des packs...</p>
                  ) : (
                    <div className="packs-list">
                      {packs.map(pack => (
                        <div key={pack.id} className="pack-item">
                          <div className="pack-header">
                            <input
                              type="checkbox"
                              id={`pack-${pack.id}`}
                              checked={selectedPacks.includes(pack.id.toString())}
                              onChange={(e) => handlePackSelection(pack.id.toString(), e.target.checked)}
                              disabled={isLoading}
                              className="pack-checkbox"
                            />
                            <label htmlFor={`pack-${pack.id}`} className="pack-label">
                              <div className="pack-info">
                                <strong className="pack-name">{pack.name}</strong>
                                <span className="pack-description">- {pack.description}</span>
                              </div>
                            </label>
                          </div>

                          {selectedPacks.includes(pack.id.toString()) && (
                            <div className="pack-details">
                              <div className="quantity-selection">
                                <label>Quantité:</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={dpmQuantities[pack.id] || 1}
                                  onChange={(e) => handlePackQuantityChange(pack.id.toString(), e.target.value)}
                                  disabled={isLoading}
                                />
                              </div>

                              <div className="stock-summary">
                                <table>
                                  <thead>
                                    <tr>
                                      <th>Référence</th>
                                      <th>Produit</th>
                                      <th>Stock DPM</th>
                                      <th>Statut</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {packStockDetails[pack.id]?.map(product => {
                                      const availableQty = availableQuantities[product.id] || 0;
                                      const requestedQty = dpmQuantities[pack.id] || 1;

                                      // Vérifie si le nom contient "câble" (insensible à la casse et accents)
                                      const isCable =
                                        product.reference &&
                                        product.reference.includes('15.02.01.01.0005');

                                      return (
                                        <tr
                                          key={product.id}
                                          className={isCable && availableQty < requestedQty ? "insufficient" : ""}
                                        >
                                          <td>{product.reference}</td>
                                          <td>{product.name}</td>
                                          <td>{availableQty}</td>
                                          <td>
                                            {isCable ? (
                                              availableQty >= requestedQty ? (
                                                <span className="sufficient">✓ Suffisant</span>
                                              ) : (
                                                <span className="insufficient">✗ Insuffisant</span>
                                              )
                                            ) : (
                                              ""
                                            )}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>

                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'products' && (
                <div className="product-selection">
                  <table className="products-table">
                    <thead>
                      <tr>
                        <th>Produit</th>
                        <th>Référence</th>
                        <th>Stock Ooredoo</th>
                        <th>Quantité à transférer</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ooredooProducts.map(product => {
                        const selectedProduct = selectedProducts.find(p => p.id === product.product.id);
                        const availableQty = product.DPM_quantity;
                        const requestedQty = selectedProduct?.quantity || 0;

                        return (
                          <tr
                            key={product.product.id}
                            className={requestedQty > availableQty ? 'insufficient-stock' : ''}
                          >
                            <td>{product.product.name}</td>
                            <td>{product.product.reference}</td>
                            <td>{availableQty}</td>
                            <td>
                              <input
                                type="number"
                                min="0"
                                max={availableQty}
                                value={requestedQty}
                                onChange={(e) => handleProductSelection(
                                  product.product.id,
                                  parseInt(e.target.value) || 0
                                )}
                                disabled={isLoading}
                              />
                              {requestedQty > availableQty && (
                                <span className="stock-warning">Stock insuffisant!</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Numéro de bon d'enlèvement */}
            <div className="form-group">
              <label>Numéro de bon d'enlèvement:</label>
              <input
                type="text"
                value={N_Bon_Enlévement_DPM}
                onChange={(e) => setN_Bon_Enlévement_DPM(e.target.value)}
                placeholder="Saisir le numéro de bon"
                disabled={isLoading}
              />
            </div>

            {/* Actions */}
            <div className="modal-actions">
              {errorMessage && (
                <div className="error-message">
                  {errorMessage.split('\n').map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </div>
              )}
              <div className="action-buttons">
                <button
                  className="cancel-btn"
                  onClick={() => setShowTransferForm(false)}
                  disabled={isLoading}
                >
                  Annuler
                </button>
                <button
                  className="confirm-btn"
                  onClick={handleCreateDPM}
                  disabled={isLoading || (selectedPacks.length === 0 && selectedProducts.length === 0)}
                >
                  {isLoading ? 'Création en cours...' : 'Créer DPM'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DpmModal;