import React, { useEffect, useState } from "react";
import axios from "axios";
import useUserData from "../hooks/useUserData";
import Navbar from "../navbar/Navbar";
import Sidebar from "../navbar/Sidebar";
import "./StockPage.css";
import PrelevementModal from "./PrelevementModal";
const StockPage = () => {
  const { user, loading, error } = useUserData();
  const [stocks, setStocks] = useState([]);
  const [filteredStocks, setFilteredStocks] = useState([]);
  const [dpmRequests, setDpmRequests] = useState([]);
  const [filteredDpmRequests, setFilteredDpmRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("current");
  const [nameFilter, setNameFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [apiError, setApiError] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [showPrelevementModal, setShowPrelevementModal] = useState(false);
  const [selectedBon, setSelectedBon] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [preleveeQtys, setPreleveeQtys] = useState({});
  const [validatingIds, setValidatingIds] = useState([]);
  const toggleDpmGroup = (index) => {
    setExpandedGroups(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };
const [items, setItems] = useState([{ imei_idu: '', imei_odu: '', serial_number: '' }]);

const addItem = () => {
  setItems([...items, { imei_idu: '', imei_odu: '', serial_number: '' }]);
};

const removeItem = (index) => {
  const newItems = [...items];
  newItems.splice(index, 1);
  setItems(newItems);
};

const handleItemChange = (index, field, value) => {
  const newItems = [...items];
  newItems[index][field] = value;
  setItems(newItems);
};

const handleSubmit = async (e) => {
  e.preventDefault();
  
  try {
    const response = await fetch(`http://localhost:3000/stock/${123}/alimenter-items`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: items.map(item => ({
          imei_idu: item.imei_idu,
          imei_odu: item.imei_odu || undefined,
          serial_number: item.serial_number
        }))
      }),
    });

    if (!response.ok) {
      throw new Error('Erreur lors de l\'alimentation du stock');
    }

    const result = await response.json();
    alert('Stock alimenté avec succès!');
    setItems([{ imei_idu: '', imei_odu: '', serial_number: '' }]); // Réinitialiser le formulaire
    
  } catch (error) {
    console.error('Error:', error);
    alert(error.message);
  }
};
  const getGlobalStatus = (movements) => {
    const statuses = movements.map(m => m.etat);
    if (statuses.includes(1)) return "en-rdv";
    if (statuses.every(s => s === 2)) return "terminé";
    if (statuses.every(s => s === 3)) return "annulé";
    return "mixte";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleConfirmPrelevement = async (datePrelev, pdfFile) => {
    console.log("Confirmation déclenchée", { datePrelev, pdfFile });
    try {
      setIsProcessing(true);
      setApiError(null);

      const formData = new FormData();
      formData.append('date_prelev', datePrelev);
      if (pdfFile) {
        formData.append('pdf', pdfFile);
        console.log("Fichier joint:", pdfFile.name);
      }

      console.log("Envoi des données...");
      const response = await axios.patch(
        `http://localhost:3000/stock-movements/confirm-prelevement/${selectedBon}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      console.log("Réponse du serveur:", response.data);
      setShowPrelevementModal(false);
      await fetchDpmRequests();
    } catch (err) {
      console.error("Erreur complète:", err);
      console.error("Réponse d'erreur:", err.response);
      setApiError(err.response?.data?.message || "Erreur lors de la confirmation du bon");
    } finally {
      setIsProcessing(false);
    }
  };

  const openPrelevementModal = (bonNumber) => {
    setSelectedBon(bonNumber);
    setShowPrelevementModal(true);
  };

  const fetchStocks = async () => {
    try {
      const response = await axios.get(
        `http://localhost:3000/stock/company/${user.company.id}`
      );
      setStocks(response.data);
      setFilteredStocks(response.data);
      setApiError(null);
    } catch (err) {
      console.error("Erreur lors de la récupération du stock:", err);
      setApiError("Erreur de chargement des données du stock");
    }
  };

  const fetchDpmRequests = async () => {
    try {
      const response = await axios.get(
        `http://localhost:3000/stock-movements/company/${user.company.id}/dpm`
      );
      setDpmRequests(response.data);
      setFilteredDpmRequests(response.data);
    } catch (err) {
      console.error("Erreur lors de la récupération des DPM:", err);
      setApiError("Erreur de chargement des demandes de prélèvement");
    }
  };

  useEffect(() => {
    let result = stocks;

    if (nameFilter && activeTab === "current") {
      result = result.filter(stock =>
        stock.product?.name?.toLowerCase().includes(nameFilter.toLowerCase())
      );
    }

    if (statusFilter && activeTab === "current") {
      result = result.filter(stock => {
        const status = getStockStatus(stock); // Utilise la fonction mise à jour
        return status === statusFilter;
      });
    }

    setFilteredStocks(result);
  }, [stocks, nameFilter, statusFilter, activeTab]);

  useEffect(() => {
  }, [preleveeQtys, dpmRequests]);

  useEffect(() => {
    if (user?.company?.id) {
      fetchStocks();
      fetchDpmRequests();
    }
  }, [user]);

  useEffect(() => {
    let result = stocks;

    if (nameFilter && activeTab === "current") {
      result = result.filter(stock =>
        stock.product?.name?.toLowerCase().includes(nameFilter.toLowerCase())
      );
    }

    if (statusFilter && activeTab === "current") {
      result = result.filter(stock => {
        const status = getStockStatus(stock);
        return status === statusFilter;
      });
    }

    setFilteredStocks(result);
  }, [stocks, nameFilter, statusFilter, activeTab]);
  useEffect(() => {
    let result = dpmRequests;

    if (nameFilter && activeTab === "dpm") {
      result = result.filter(request =>
        request.movements.some(movement =>
          movement.product.name.toLowerCase().includes(nameFilter.toLowerCase())
        )
      );
    }

    if (statusFilter && activeTab === "dpm") {
      result = result.filter(request =>
        request.movements.some(movement =>
          getDpmStatus(movement) === statusFilter)
      );
    }

    setFilteredDpmRequests(result);
  }, [dpmRequests, nameFilter, statusFilter, activeTab]);

  const getStockStatus = (stock) => {
    // Vérifiez que stock est bien un objet avec product et quantity
    if (!stock || !stock.product || stock.quantity === undefined) return "Unknown";

    const low = stock.product.lowThreshold;
    const medium = stock.product.mediumThreshold;

    if (low === undefined || medium === undefined) return "Unknown";

    if (stock.quantity <= low) return "Low";
    if (stock.quantity <= medium) return "Medium";
    return "High";
  };
  const getDpmStatus = (movement) => {
    switch (movement.etat) {
      case 0: return "En attente";
      case 1: return "En RDV";
      case 2: return "Terminé";
      case 3: return "Annulé";
      default: return "Inconnu";
    }
  };
  const isAllProductsValidated = (movements) => {
    return movements.every(m => 
      m.etat !== 1 || 
      (m.preleveeQty !== null && 
       m.preleveeQty !== undefined &&
       m.preleveeQty >= 0)
    );
  };
  if (loading) return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Chargement en cours...</p>
    </div>
  );

  if (error) return (
    <div className="error-message">
      Erreur d'authentification: {error.message}
    </div>
  );
  const handleValidateQty = async (movementId, qty) => {
    try {
      setValidatingIds(prev => [...prev, movementId]);
      
      await axios.post(
        `http://localhost:3000/stock-movements/valider_qte_prisStock/${movementId}`,
        { preleveeQty: qty }
      );
  
      // Met à jour l'état local
      setDpmRequests(prev => prev.map(request => ({
        ...request,
        movements: request.movements.map(m => 
          m.id === movementId ? { ...m, preleveeQty: qty } : m
        )
      })));
  
      return true;
    } catch (err) {
      console.error("Erreur:", err);
      setApiError(err.response?.data?.message || "Erreur de validation");
      return false;
    } finally {
      setValidatingIds(prev => prev.filter(id => id !== movementId));
    }
  };

  return (
    <div className="dashboard">
      <Navbar />
      <Sidebar />

      <div className="content">
        <div className="tabs">
          <button
            className={`tab ${activeTab === "current" ? "active" : ""}`}
            onClick={() => setActiveTab("current")}
          >
            Stock Actuel
          </button>
          <button
            className={`tab ${activeTab === "dpm" ? "active" : ""}`}
            onClick={() => setActiveTab("dpm")}
          >
            Demandes de Prélèvement
          </button>
          <button
            className={`tab ${activeTab === "alimentation" ? "active" : ""}`}
            onClick={() => setActiveTab("alimentation")}
          >
            Alimentation Stock
          </button>
        </div>

        {apiError && (
          <div className="alert error">
            {apiError}
            <button onClick={activeTab === "current" ? fetchStocks : fetchDpmRequests}>
              Réessayer
            </button>
          </div>
        )}

{activeTab === "alimentation" && (
  <>
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Alimenter le Stock</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Item {index + 1}</h3>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="text-red-500 text-sm"
                  >
                    Supprimer
                  </button>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">IMEI IDU</label>
                <input
                  type="text"
                  value={item.imei_idu || ''}
                  onChange={(e) => handleItemChange(index, 'imei_idu', e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">IMEI ODU (optionnel)</label>
                <input
                  type="text"
                  value={item.imei_odu || ''}
                  onChange={(e) => handleItemChange(index, 'imei_odu', e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Numéro de série</label>
                <input
                  type="text"
                  value={item.serial_number || ''}
                  onChange={(e) => handleItemChange(index, 'serial_number', e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  required
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex space-x-4">
          <button
            type="button"
            onClick={addItem}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
          >
            Ajouter un item
          </button>
          
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Envoyer
          </button>
        </div>
      </form>
    </div>
  </>
)}
        {activeTab === "current" && (
          <>
            <div className="filters">
              <input
                type="text"
                placeholder="Filtrer par nom"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Tous les statuts</option>
                <option value="High">Stock Élevé</option>
                <option value="Medium">Stock Moyen</option>
                <option value="Low">Stock Bas</option>
              </select>
            </div>

            <div className="stock-list">
              <div className="header">
                <div>Produit</div>
                <div>Description</div>
                <div>Quantité</div>
                <div>Statut</div>
              </div>

              {filteredStocks.length > 0 ? (
                filteredStocks.map((stock, index) => (
                  <div key={index} className="item">
                    <div>{stock.product?.name || "-"}</div>
                    <div>{stock.product?.description || "-"}</div>
                    <div>{stock.quantity}</div>
                    <div className={`status ${getStockStatus(stock)}`}>
                      {getStockStatus(stock)}
                      <small className="threshold-info">
                        {/*(Seuils: {stock.product?.lowThreshold ?? 10}/{stock.product?.mediumThreshold ?? 50})*/}
                      </small>
                    </div>
                  </div>

                ))
              ) : (
                <div className="empty">
                  Aucun résultat trouvé pour les filtres sélectionnés
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === "dpm" && (
          <>
            <div className="filters">
              <input
                type="text"
                placeholder="Rechercher par bon, produit ou société..."
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
              />
            </div>

            <div className="dpm-container">
              {filteredDpmRequests.length > 0 ? (
                filteredDpmRequests.map((request, index) => (
                  <div key={index} className="dpm-card">
                    <div className="dpm-header">
                      <div className="bon-info">
                        <span className="bon-number">Bon: {request.bon}</span>
                        <span className="items-count">{request.movements.length} article(s)</span>
                      </div>
                      <div className="bon-actions">
                        {/* Afficher le bouton seulement si tous les produits sont validés */}
                        {request.movements.some(m => m.etat === 1) && (
                          <>
                            {isAllProductsValidated(request.movements) ? (
                              <button
                                className="confirm-btn"
                                onClick={() => openPrelevementModal(request.bon)}
                                disabled={isProcessing}
                              >
                                {isProcessing ? "Traitement..." : "Confirmer prélèvement"}
                              </button>
                            ) : (
                              <div className="validation-required">
                                <span className="info-icon">ℹ️</span>
                                <span className="info-text">Valider toutes les quantités</span>
                              </div>
                            )}
                          </>
                        )}

                        <div className="bon-status">
                          <span className={`status-badge ${getGlobalStatus(request.movements)}`}>
                            {getGlobalStatus(request.movements)}
                          </span>
                          <span
                            className={`toggle-icon ${expandedGroups[index] ? 'expanded' : ''}`}
                            onClick={() => toggleDpmGroup(index)}
                          />
                        </div>
                      </div>
                    </div>

                    {expandedGroups[index] && (
                      <div className="dpm-details">
                        <div className="table-header">
                          <span>Produit</span>
                          <span>Société</span>
                          <span>Quantité</span>
                          <span>Date RDV</span>
                          <span>Date prél.</span>
                          <span>Statut</span>
                        </div>
                        {request.movements.map((movement, mIndex) => (
                          <div key={mIndex} className="dpm-row">
                            <div className="product-cell">
                              <strong>{movement.product.name}</strong>
                              <small>{movement.product.reference}</small>
                            </div>
                            <div>{movement.toCompany.name}</div>
                            <div>{movement.quantity}</div>
                            <div>{formatDate(movement.date_rdv)}</div>
                            <div>{formatDate(movement.date_prelev)}</div>
                            <div>
                              <span className={`status-badge ${getDpmStatus(movement).toLowerCase().replace(' ', '-')}`}>
                                {getDpmStatus(movement)}
                              </span>
                            </div>
                            <div className="validate-qty">
  {movement.etat === 1 && (
    <div className="qty-input-group">
      <input
        type="number"
        min="0"
        max={movement.quantity}
        defaultValue={movement.preleveeQty || ""}
        onBlur={(e) => handleValidateQty(movement.id, parseInt(e.target.value))}
        placeholder="Qté prise"
      />
      <button
        onClick={async (e) => {
          const input = e.target.previousSibling;
          const qty = parseInt(input.value);
          
          if (!isNaN(qty)) {
            const success = await handleValidateQty(movement.id, qty);
            if (success) {
              // Force le re-rendu avec la nouvelle couleur
              setDpmRequests(prev => [...prev]);
            }
          }
        }}
        disabled={validatingIds.includes(movement.id)}
        className={`validate-icon ${
          validatingIds.includes(movement.id) ? 'validating' 
          : movement.preleveeQty ? 'validated' 
          : 'pending'
        }`}
      >
        {validatingIds.includes(movement.id) ? "..." : "✓"}
      </button>
    </div>
  )}
</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <img src="/icons/empty-dpm.svg" alt="Aucune donnée" />
                  <p>Aucune demande de prélèvement trouvée</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {showPrelevementModal && (
        <PrelevementModal
          show={showPrelevementModal}
          onClose={() => !isProcessing && setShowPrelevementModal(false)}
          onConfirm={handleConfirmPrelevement}
          title={`Confirmer prélèvement - Bon ${selectedBon}`}
          message="Veuillez saisir la date de prélèvement et éventuellement joindre un PDF"
          loading={isProcessing}
          error={apiError}
        />
      )}
    </div>
  );
};

export default StockPage;