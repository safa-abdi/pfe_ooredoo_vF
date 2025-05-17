import { useState, useEffect } from 'react';

const useStockData = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStockData = async () => {
    try {
      const response = await fetch('http://localhost:3000/stock');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Erreur lors de la récupération du stock:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockData();
  }, []);

  return { products, loading, fetchStockData };
};

export default useStockData;