const API_URL = 'http://localhost:3000';

export const fetchStockData = async () => {
  const response = await fetch(`${API_URL}/stock`);
  return response.json();
};

export const addProduct = async (product) => {
  const response = await fetch(`${API_URL}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product),
  });
  return response.json();
};

export const updateProduct = async (product) => {
  const response = await fetch(`${API_URL}/products/${product.product.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product.product),
  });
  return response.json();
};

export const alimProduct = async (productData) => {
  const response = await fetch(`${API_URL}/stock/alim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData),
  });
  return response.json();
};