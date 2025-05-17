import React from 'react';

const ModifyProductModal = ({ 
  selectedProduct, 
  setSelectedProduct, 
  setShowModifyProductPopup, 
  fetchStockData 
}) => {
  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:3000/products/${selectedProduct.product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedProduct.product),
      });

      if (response.ok) {
        alert("Produit modifié avec succès !");
        setShowModifyProductPopup(false);
        fetchStockData();
      } else {
        console.error("Erreur:", response.statusText);
        alert("Une erreur s'est produite.");
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Une erreur s'est produite.");
    }
  };

  return (
    <div className="transfer-modal">
      <div className="transfer-content">
        <h2>Modifier un Produit</h2>
        <form onSubmit={handleUpdateProduct}>
          <div className="form-group">
            <label htmlFor="productName">Nom du Produit</label>
            <input
              type="text"
              id="productName"
              value={selectedProduct.product.name}
              onChange={(e) =>
                setSelectedProduct({
                  ...selectedProduct,
                  product: {
                    ...selectedProduct.product,
                    name: e.target.value,
                  },
                })
              }
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="productRef">Référence</label>
            <input
              type="text"
              id="productRef"
              value={selectedProduct.product.reference}
              onChange={(e) =>
                setSelectedProduct({
                  ...selectedProduct,
                  product: {
                    ...selectedProduct.product,
                    reference: e.target.value,
                  },
                })
              }
            />
          </div>

          <div className="form-group">
            <label htmlFor="productDescription">Description</label>
            <textarea
              id="productDescription"
              value={selectedProduct.product.description}
              onChange={(e) =>
                setSelectedProduct({
                  ...selectedProduct,
                  product: {
                    ...selectedProduct.product,
                    description: e.target.value,
                  },
                })
              }
              required
            />
          </div>

          <button type="submit">Enregistrer</button>
          <button
            type="button"
            className="cancel-btn"
            onClick={() => setShowModifyProductPopup(false)}
          >
            Annuler
          </button>
        </form>
      </div>
    </div>
  );
};

export default ModifyProductModal;