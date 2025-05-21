import React, { useState, useEffect } from 'react';
import AddProductModal from './AddProductModal';
import ModifyProductModal from './ModifyProductModal';

const GlobalStockView = ({ ooredooProducts, fetchStockData, companyId }) => {
  const [showAddProductPopup, setShowAddProductPopup] = useState(false);
  const [showModifyProductPopup, setShowModifyProductPopup] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productsList, setProductsList] = useState([]);
  const [showStockPopup, setShowStockPopup] = useState(false);
  const [showArchivePopup, setShowArchivePopup] = useState(false);
  const [productToArchive, setProductToArchive] = useState(null);

  const [stockData, setStockData] = useState({
    productId: '',
    quantity: 0
  });
  const [bulkStockData, setBulkStockData] = useState([]);
  const [newProduct, setNewProduct] = useState({
    name: '',
    reference: '',
    description: '',
    quantity: 0,
  });
  const archiveProduct = async (id) => {

    try {
      const response = await fetch(`http://localhost:3000/products/archiver/${id}`, {
        method: 'PUT',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l’archivage du produit');
      }

      setProductsList(prev => prev.filter(product => product.id !== id));
    } catch (error) {
      console.error('Erreur:', error);
    }
  };


  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('http://localhost:3000/products');
        const data = await response.json();
        setProductsList(data);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    if (showStockPopup) {
      fetchProducts();
    }
  }, [showStockPopup]);
  const handleAddStock = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:3000/stock/alimenter/${companyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stockData),
      });

      if (response.ok) {
        alert("Stock alimenté avec succès !");
        setShowStockPopup(false);
        fetchStockData();
        setStockData({ productId: '', quantity: 0 });
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const handleBulkAddStock = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:3000/stock/alimenter-multiple/${companyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: bulkStockData }),
      });

      if (response.ok) {
        alert("Stocks alimentés avec succès !");
        setShowStockPopup(false);
        fetchStockData();
        setBulkStockData([]);
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const addToBulkList = (product) => {
    if (bulkStockData.some(item => item.productId === product.id)) {
      removeFromBulkList(product.id);
    } else {
      setBulkStockData([...bulkStockData, {
        productId: product.id,
        quantity: 0
      }]);
    }
  };

  const updateBulkQuantity = (productId, quantity) => {
    setBulkStockData(bulkStockData.map(item =>
      item.productId === productId ? { ...item, quantity: Number(quantity) } : item
    ));
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3000/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct),
      });

      if (response.ok) {
        alert("Produit ajouté avec succès !");
        setShowAddProductPopup(false);
        fetchStockData();
        setNewProduct({ name: '', reference: '', description: '', quantity: 0 });
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const removeFromBulkList = (productId) => {
    setBulkStockData(bulkStockData.filter(item => item.productId !== productId));
  };


  const handleModifyProduct = (product) => {
    setSelectedProduct(product);
    setShowModifyProductPopup(true);
  };

  return (
    <>
      <div className="action-buttons2">
        <button
          className="add-product-btn"
          onClick={() => setShowAddProductPopup(true)}
        >
          Ajouter un produit
        </button>

        <button
          className="add-stock-btn"
          onClick={() => setShowStockPopup(true)}
        >
          Alimenter le stock
        </button>
      </div>
      <div className="product-listOoredoo_stt">
        <h2>Liste des Produits Ooredoo</h2>
        <table className="product-tableOoredooStt">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Quantité</th>
              <th>Référence</th>
              <th>Description</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {ooredooProducts.map((product, index) => (
              <tr key={index}>
                <td>{product.product.name}</td>
                <td>{product.quantity}</td>
                <td>{product.product.reference}</td>
                <td>{product.product.description}</td>
                <td>
                  <button
                    className="modify-btn"
                    onClick={() => handleModifyProduct(product)}
                  >
                    Modifier
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddProductPopup && (
        <div className="modal-overlayAdd">
          <div className="modal-contentAdd">
            <button
              className="close-modal"
              onClick={() => setShowAddProductPopup(false)}
            >
              &times;
            </button>
            <AddProductModal
              newProduct={newProduct}
              setNewProduct={setNewProduct}
              handleAddProduct={handleAddProduct}
              setShowAddProductPopup={setShowAddProductPopup}
            />
          </div>
        </div>
      )}

      {showModifyProductPopup && (
        <div className="modal-overlayAdd">
          <div className="modal-contentAdd">
            <button
              className="close-modal"
              onClick={() => setShowModifyProductPopup(false)}
            >
              &times;
            </button>
            <ModifyProductModal
              selectedProduct={selectedProduct}
              setSelectedProduct={setSelectedProduct}
              setShowModifyProductPopup={setShowModifyProductPopup}
              fetchStockData={fetchStockData}
            />
          </div>
        </div>
      )}

      {showStockPopup && (
        <div className="stock-modal-overlay">
          <div className="stock-modal-content">
            <button
              className="stock-modal-close"
              onClick={() => setShowStockPopup(false)}
            >
              &times;
            </button>

            <h2 className="stock-modal-title">Alimenter le stock</h2>
            <h3 className="stock-section-title">Produits disponibles</h3>

            <div className="stock-bulk-container">
              <div className="stock-product-list">
                <h4></h4>
                <ul>
                  <ul>
                    {productsList.map(product => {
                      const isSelected = bulkStockData.some(item => item.productId === product.id);
                      return (
                        <li
                          key={product.id}
                          className={`stock-product-item ${isSelected ? 'selected' : ''}`}
                        >
                          {product.name} ({product.description})
                          <button
                            className="stock-add-btn"
                            onClick={() => addToBulkList(product)}
                          >
                            {isSelected ? 'Retirer' : 'Ajouter'}
                          </button>
                          <button
                            className="stock-archive-btn"
                            onClick={() => {
                              setProductToArchive(product);
                              setShowArchivePopup(true);
                            }}
                          >
                            Archiver
                          </button>

                        </li>
                      );
                    })}
                  </ul>
                </ul>
              </div>
              {showArchivePopup && productToArchive && (
                <div className="modal-overlay">
                  <div className="modal-content">
                    <h3>Confirmer l’archivage</h3>
                    <p>Voulez-vous vraiment archiver le produit : <strong>{productToArchive.name}</strong> ?</p>
                    <div className="modal-actions">
                      <button
                        className="confirm-btn"
                        onClick={async () => {
                          await archiveProduct(productToArchive.id);
                          setShowArchivePopup(false);
                          setProductToArchive(null);
                        }}
                      >
                        Oui, archiver
                      </button>
                      <button
                        className="cancel-btn"
                        onClick={() => {
                          setShowArchivePopup(false);
                          setProductToArchive(null);
                        }}
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="stock-selected-products">
                <h4>Produits à alimenter</h4>
                {bulkStockData.length > 0 ? (
                  <>
                    <table className="stock-products-table">
                      <thead>
                        <tr>
                          <th>Produit</th>
                          <th>Quantité</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkStockData.map((item, index) => {
                          const product = productsList.find(p => p.id === item.productId);
                          return (
                            <tr key={index}>
                              <td>{product?.name}</td>
                              <td>
                                <input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => updateBulkQuantity(item.productId, e.target.value)}
                                  min="0"
                                  className="stock-quantity-input"
                                />
                              </td>
                              <td>
                                <button
                                  className="stock-remove-btn"
                                  onClick={() => removeFromBulkList(item.productId)}
                                >
                                  Retirer
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <div className="stock-bulk-actions">
                      <button
                        className="stock-bulk-submit"
                        onClick={handleBulkAddStock}
                      >
                        Valider l'alimentation multiple
                      </button>
                      <button
                        className="stock-clear-all-btn"
                        onClick={() => setBulkStockData([])}
                      >
                        Tout effacer
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="stock-empty-state">
                    <p>Aucun produit sélectionné</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GlobalStockView;