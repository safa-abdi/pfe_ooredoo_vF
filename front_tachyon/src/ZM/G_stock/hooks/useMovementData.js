import { useState, useEffect } from 'react';

const useMovementData = () => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMovementData = async () => {
    try {
      const response = await fetch('http://localhost:3000/stock-movements');
      const data = await response.json();
      setMovements(data);
    } catch (error) {
      console.error("Erreur lors de la récupération des mouvements:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovementData();
  }, []);

  return { movements, loading, fetchMovementData };
};

export default useMovementData;