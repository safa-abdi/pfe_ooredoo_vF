import React, { useState } from 'react';
import './TransferModal.css';

const TransferModal = ({
  companies = [],
  setShowTransferModal,
  STTProducts = [],
  selectedCompanyId,
  createTransfer,
  onTransferComplete 
}) => {
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const [formData, setFormData] = useState({
    from_company_id: selectedCompanyId,
    to_company_id: '',
    movement_type: 'transfert',
    N_Bon_Enlévement_DPM: '',
  });

  const handleCompanyChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProductToggle = (product) => {
    setSelectedProducts(prev => {
      const existingIndex = prev.findIndex(p => p.id === product.id);
      if (existingIndex >= 0) {
        return prev.filter(p => p.id !== product.id);
      } else {
        return [...prev, { id: product.id, quantity: 1, product }];
      }
    });
  };

  const handleQuantityChange = (productId, value) => {
    const quantity = parseInt(value) || 1;
    setSelectedProducts(prev =>
      prev.map(p =>
        p.id === productId ? { ...p, quantity: Math.max(1, quantity) } : p
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (selectedProducts.length === 0) {
      alert('Veuillez sélectionner au moins un produit');
      return;
    }
  
    // Préparation du payload selon le type de transfert
    const payload = selectedProducts.length === 1
      ? { // Format pour transfert simple
          product_id: selectedProducts[0].id,
          quantity: selectedProducts[0].quantity,
          from_company_id: formData.from_company_id,
          to_company_id: formData.to_company_id,
          N_Bon_Enlévement_DPM: formData.N_Bon_Enlévement_DPM
        }
      : { // Format pour transfert multiple
          products: selectedProducts.map(p => ({
            product_id: p.id,
            quantity: p.quantity
          })),
          from_company_id: formData.from_company_id,
          to_company_id: formData.to_company_id,
          N_Bon_Enlévement_DPM: formData.N_Bon_Enlévement_DPM
        };
  
        try {
          const response = await createTransfer(payload);
          console.log('Transfert réussi:', response);
        
          setShowSuccessPopup(true); // Afficher popup
          setTimeout(() => {
            setShowSuccessPopup(false);
            setShowTransferModal(false); // Fermer modal après popup
            onTransferComplete?.(); // Mettre à jour données
          }, 2000); // 2 secondes
        
        } catch (err) {
          console.error('Erreur lors du transfert:', err);
          alert(`Erreur lors du transfert: ${err.message}`);
        }
        
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-modal" onClick={() => setShowTransferModal(false)}>
          &times;
        </button>

        <h2>Transfert entre STT</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Numéro Bon transfert:</label>
            <input
              type="text"
              name="N_Bon_Enlévement_DPM"
              value={formData.N_Bon_Enlévement_DPM}
              onChange={handleCompanyChange}
            />
          </div>

          <div className="form-group">
            <label>Produits à transférer:</label>
            <div className="custom-select-wrapper">
              <div
                className="custom-select-box"
                onClick={() => setDropdownOpen(prev => !prev)}
              >
                {selectedProducts.length > 0 
                  ? `${selectedProducts.length} produit(s) sélectionné(s)` 
                  : "Sélectionner les produits..."}
              </div>
              {dropdownOpen && (
                <div className="custom-select-options">
                  {STTProducts.map(product => {
                    const isSelected = selectedProducts.some(p => p.id === product.id);
                    const selectedProduct = isSelected 
                      ? selectedProducts.find(p => p.id === product.id) 
                      : null;

                    return (
                      <div key={product.id} className="custom-option">
                        <label>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleProductToggle(product)}
                          />
                          {product.name} (Stock: {product.quantity})
                        </label>
                        {isSelected && (
                          <input
                            type="number"
                            min="1"
                            max={product.quantity}
                            value={selectedProduct.quantity}
                            onChange={(e) =>
                              handleQuantityChange(product.id, e.target.value)
                            }
                            placeholder="Qté"
                            className="quantity-input"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {selectedProducts.length > 0 && (
              <div className="selected-products-list">
                <h4>Produits sélectionnés:</h4>
                <ul>
                  {selectedProducts.map(p => (
                    <li key={p.id}>
                      {p.product.name} - Quantité: {p.quantity}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>STT Source:</label>
            <input
              type="text"
              value={companies.find(c => c.id === formData.from_company_id)?.name || ''}
              readOnly
            />
          </div>

          <div className="form-group">
            <label>STT Destination:</label>
            <select
              name="to_company_id"
              value={formData.to_company_id}
              onChange={handleCompanyChange}
              required
            >
              <option value="">Sélectionner un STT</option>
              {companies
                .filter(c => c.id !== formData.from_company_id)
                .map(company => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
            </select>
          </div>

          <button type="submit">Effectuer le transfert</button>
          {showSuccessPopup && (
  <div className="success-popup">
    ✅ Demande de transfert effectuée avec succès !
  </div>
)}

        </form>
      </div>
    </div>
  );
};

export default TransferModal;