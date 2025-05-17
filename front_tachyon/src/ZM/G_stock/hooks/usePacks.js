import { useState, useEffect } from 'react';

const usePacks = () => {
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPacks = async () => {
    try {
      const response = await fetch('http://localhost:3000/packs');
      const data = await response.json();
      setPacks(data);
    } catch (error) {
      console.error("Erreur lors de la récupération des packs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPacks();
  }, []);

  return { packs, loading, fetchPacks };
};

export default usePacks;