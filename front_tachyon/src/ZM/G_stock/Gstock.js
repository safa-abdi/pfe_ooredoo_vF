import React, { useState, useEffect } from 'react';
import NavbarHorizontal from '../navbar/NavbarHorizontal';
import NavbarVertical from '../navbar/NavbarVertical';
import GlobalStockView from './components/GlobalStockView';
import SubcontractorStockView from './components/SubcontractorStockView';
import StockMovementsView from './components/StockMovementsView';
import './pages/G_stock.css';

const Gstock = () => {
  // États principaux
  const [viewStock, setViewStock] = useState('global');
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const [loading, setLoading] = useState(true);
  const [filterMvtType, setFilterMvtType] = useState('');

  // États pour les données
  const [products, setProducts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [allcompanies, setallCompanies] = useState([]);
  const [allmvmnt, setallmvmnt] = useState([]);
  const [packs, setPacks] = useState([]);
  const [ooredooProducts, setOoredooProducts] = useState([]);
  const [STTProducts, setSTTProducts] = useState([]);

  const [selectedSubcontractor, setSelectedSubcontractor] = useState('');
  const [filterEmetteur, setFilterEmetteur] = useState('');
  const [filterRecepteur, setFilterRecepteur] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterState, setFilterState] = useState('');

  const ooredooCompany = allcompanies.find(c => c.name === "Ooredoo");
  const ooredooCompanyId = ooredooCompany ? ooredooCompany.id : null;

  const fetchStockData = async () => {
    try {
      const response = await fetch('http://localhost:3000/stock');
      const data = await response.json();
      setProducts(data);
      setOoredooProducts(data.filter(product => product.company.name === 'Ooredoo'));
    } catch (error) {
      console.error("Erreur lors de la récupération du stock:", error);
    }
  };
  const FetchSTTData = async (id) => {
    try {
      const response = await fetch(`http://localhost:3000/stock/company/${id}`);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      const transformedProducts = data.map(item => ({
        id: item.product.id,
        name: item.product.name,
        reference: item.product.reference,
        description: item.product.description,
        quantity: item.quantity,
        status: item.status,
        companyId: item.company.id
      }));
      
      setSTTProducts(transformedProducts);
  
    } catch (error) {
      console.error("Erreur lors de la récupération du stock:", error);
      setSTTProducts([]); 
    }
  };
  useEffect(() => {
    if (selectedSubcontractor) {
      const company = companies.find(c => c.name === selectedSubcontractor);
      if (company) {
        FetchSTTData(company.id);
      }
    } else {
      setSTTProducts([]);
    }
  }, [selectedSubcontractor, companies]);
  const fetchCompanies = async () => {
    try {
      const response = await fetch('http://localhost:3000/companies');
      const data = await response.json();
      const filteredCompanies = data.filter(company => company.name !== "Ooredoo");
      setCompanies(filteredCompanies);
    } catch (error) {
      console.error("Erreur lors de la récupération des entreprises:", error);
    }
  };

  const fetchallCompanies = async () => {
    try {
      const response = await fetch('http://localhost:3000/companies');
      const data = await response.json();
      setallCompanies(data);
    } catch (error) {
      console.error("Erreur lors de la récupération des entreprises:", error);
    }
  };

  const fetchMvmntData = async () => {
    try {
      const response = await fetch('http://localhost:3000/stock-movements');
      const data = await response.json();
      setallmvmnt(data);
    } catch (error) {
      console.error("Erreur lors de la récupération des mouvements de stock:", error);
    }
  };

  const fetchPacks = async () => {
    try {
      const response = await fetch('http://localhost:3000/packs');
      const data = await response.json();
      setPacks(data);
    } catch (error) {
      console.error("Erreur lors de la récupération des packs:", error);
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      await Promise.all([
        fetchStockData(),
        fetchCompanies(),
        fetchallCompanies(),
        fetchMvmntData(),
        fetchPacks()
      ]);
      setLoading(false);
    };
    
    fetchAllData();
  }, []);

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="containerStock">
      <NavbarHorizontal />
      <div className="main-contentOO">
        <NavbarVertical 
          isVisible={isNavbarVisible} 
          toggleNavbar={() => setIsNavbarVisible(!isNavbarVisible)} 
        />
        <div className="browser-tabs">
  <div className="tab-bar">
    <button 
      className={`tab ${viewStock === 'global' ? 'active' : ''}`} 
      onClick={() => setViewStock('global')}
    >
      Stock Ooredoo
    </button>
    <button 
      className={`tab ${viewStock === 'stt' ? 'active' : ''}`} 
      onClick={() => setViewStock('stt')}
    >
      Stock Sous-traitants
    </button>
    <button 
      className={`tab ${viewStock === 'Mvt' ? 'active' : ''}`} 
      onClick={() => setViewStock('Mvt')}
    >
      Mouvements de stock
    </button>
  </div>

  {/* Zone de contenu sous l'onglet */}
  <div className="tab-content">
    {viewStock === 'global' && (
      <GlobalStockView 
        products={products}
        fetchStockData={fetchStockData}
        ooredooProducts={ooredooProducts}
        companyId={ooredooCompanyId}
      />
    )}

    {viewStock === 'stt' && (
      <SubcontractorStockView 
        companies={companies}
        packs={packs}
        selectedSubcontractor={selectedSubcontractor}
        setSelectedSubcontractor={setSelectedSubcontractor}
        fetchPacks={fetchPacks}
        ooredooProducts={ooredooProducts}
        STTProducts={STTProducts}
      />
    )}

    {viewStock === 'Mvt' && (
      <StockMovementsView 
        allmvmnt={allmvmnt}
        allcompanies={allcompanies}
        filterEmetteur={filterEmetteur}
        setFilterEmetteur={setFilterEmetteur}
        filterRecepteur={filterRecepteur}
        setFilterRecepteur={setFilterRecepteur}
        filterDate={filterDate}
        setFilterDate={setFilterDate}
        filterState={filterState}
        setFilterState={setFilterState}
        fetchStockData={fetchStockData}
        fetchMvmntData={fetchMvmntData}
        filterMvtType={filterMvtType}         
        setFilterMvtType={setFilterMvtType}
      />
    )}
  </div>
</div>
      </div>
    </div>
  );
};

export default Gstock;