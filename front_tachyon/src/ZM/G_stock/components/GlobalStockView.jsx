import React, { useState } from 'react';
import AddProductModal from './AddProductModal';
import ModifyProductModal from './ModifyProductModal';

const GlobalStockView = ({ ooredooProducts, fetchStockData }) => {
  const [showAddProductPopup, setShowAddProductPopup] = useState(false);
  const [showModifyProductPopup, setShowModifyProductPopup] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    reference: '',
    description: '',
    quantity: 0,
  });

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

  const handleModifyProduct = (product) => {
    setSelectedProduct(product);
    setShowModifyProductPopup(true);
  };

  return (
    <>
      <button 
        className="add-product-btn" 
        onClick={() => setShowAddProductPopup(true)}
      >
        Ajouter un produit
      </button>

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
        <AddProductModal
          newProduct={newProduct}
          setNewProduct={setNewProduct}
          handleAddProduct={handleAddProduct}
          setShowAddProductPopup={setShowAddProductPopup}
        />
      )}

      {showModifyProductPopup && (
        <ModifyProductModal
          selectedProduct={selectedProduct}
          setSelectedProduct={setSelectedProduct}
          setShowModifyProductPopup={setShowModifyProductPopup}
          fetchStockData={fetchStockData}
        />
      )}
    </>
  );
};

export default GlobalStockView;