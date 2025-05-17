import { useState, useEffect } from 'react';

const useSTTData = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCompanies = async () => {
    try {
      const response = await fetch('http://localhost:3000/companies');
      const data = await response.json();
      setCompanies(data.filter(company => company.name !== "Ooredoo"));
    } catch (error) {
      console.error("Erreur lors de la récupération des entreprises:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  return { companies, loading, fetchCompanies };
};

export default useSTTData;