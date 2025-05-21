import React from 'react';

const AddProductModal = ({ 
  newProduct, 
  setNewProduct, 
  handleAddProduct, 
  setShowAddProductPopup 
}) => {
  return (
    <div className="transfer-modal">
      <div className="transfer-content">
        <h2>Ajouter un Produit</h2>
        <form onSubmit={handleAddProduct}>
          <div className="form-group">
            <label htmlFor="productName">Nom du Produit</label>
            <input
              type="text"
              id="productName"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="productRef">Référence</label>
            <input
              type="string"
              id="productRef"
              value={newProduct.reference}
              onChange={(e) => setNewProduct({ ...newProduct, reference: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="productDescription">Description</label>
            <textarea
              id="productDescription"
              value={newProduct.description}
              onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
              required
            />
          </div>

          <button className='btnAdd_Stock' type="submit">Ajouter</button>
          <button
            type="button"
            className="cancel-btn"
            onClick={() => setShowAddProductPopup(false)}
          >
            Annuler
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;