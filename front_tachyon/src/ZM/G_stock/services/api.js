export const fetchStock = async () => {
  const response = await fetch('http://localhost:3000/stock');
  return response.json();
};

export const fetchMovements = async () => {
  const response = await fetch('http://localhost:3000/stock-movements');
  return response.json();
};

export const createMovement = async (movement) => {
  const response = await fetch('http://localhost:3000/stock-movements', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(movement),
  });
  return response.json();
};

export const updateProduct = async (productId, productData) => {
  const response = await fetch(`http://localhost:3000/products/${productId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(productData),
  });
  return response.json();
};

export const addProduct = async (productData) => {
  const response = await fetch('http://localhost:3000/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(productData),
  });
  return response.json();
};