import React, { useState, useEffect, Suspense, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';
import '../resiliationStyle.css';
import { BASE_API_URL } from '../../../../config';
import ResiliationDetails from '../component/ResiliationDetails';
import ModalResiliation from '../component/ModalResiliation';
const NavbarHorizontal = React.lazy(() => import('../../../navbar/NavbarHorizontal'));
const NavbarVertical = React.lazy(() => import('../../../navbar/NavbarVertical'));
const ResiliationsContent = React.lazy(() => import('../component/ResiliationContent'));

const ResiliationsPage = () => {
  const [resiliation, setResiliations] = useState([]);
  const [problemResiliations, setProblemResiliations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const [selectedPlainte, setSelectedPlainte] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState({
    STATUT: '',
    gouvernorat: '',
    delegation: '',
    DATE_CREATION: '',
    TYPE_PLAINTE: '',
    SOURCE_PLAINTE: '',
    PRIORITE: '',
    CRM_CASE: '',
  });
  const [lastId, setLastId] = useState(null);
  const [viewWithProblem, setViewWithProblem] = useState(false);
  const limit = 50;

  const gouvernoratsTunisie = [
    "Ariana", "Béja", "Ben Arous", "Bizerte", "Gabès", "Gafsa", "Jendouba", "Kairouan",
    "Kasserine", "Kébili", "Le Kef", "Mahdia", "La Manouba", "Médenine", "Monastir",
    "Nabeul", "Sfax", "Sidi Bouzid", "Siliana", "Sousse", "Tataouine", "Tozeur", "Tunis", "Zaghouan",
  ];

 const fetchProblemResiliations = useCallback(async (signal) => {
  try {
    const params = { page: page.toString(), limit: limit.toString(), lastId };
    const queryString = new URLSearchParams(params).toString();
    const url = `${BASE_API_URL}/resiliation/problemes?${queryString}`;

    const response = await fetch(url, {
      signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) throw new Error('Erreur lors de la récupération des resiliation avec problème');
    const result = await response.json();
    setProblemResiliations(result.data || []);
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Erreur:', error);
      setProblemResiliations([]);
    }
  }
}, [page, limit, lastId]);



const fetchResiliations = useCallback(async (signal) => {
  if (!hasMore) return; // On arrête si plus de données

  try {
    const params = {
      searchTerm: searchTerm.trim(),
      limit: limit.toString(),
      cursor: lastId || undefined,
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value != null && value !== '')
      ),
    };

    const cleanedParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== undefined && value !== '')
    );

    const queryString = new URLSearchParams(cleanedParams).toString();
    const url = `${BASE_API_URL}/resiliation/valid?${queryString}`;

    const response = await fetch(url, { signal, headers: { Accept: 'application/json' } });

    if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
    
    const result = await response.json();
    const data = result.data || [];
    const nextCursor = result.nextCursor;

    if (data.length === 0 || !nextCursor) {
      setHasMore(false); // Plus de données à charger
    }

    setResiliations(prev => [...prev, ...data]);
    setLastId(nextCursor);
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Erreur:', error);
      setHasMore(false);
    }
  }
}, [searchTerm, limit, filters, lastId, hasMore]);

useEffect(() => {
  const controller = new AbortController();
  const signal = controller.signal;

  const fetchData = async () => {
    try {
      await fetchResiliations(signal);
      await fetchProblemResiliations(signal);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Erreur:', error);
      }
    }
  };
  fetchData();

  return () => {
    controller.abort();
  };
}, [fetchResiliations, fetchProblemResiliations, page]);
  const debouncedSearch = useMemo(
    () => debounce((term) => {
      setSearchTerm(term);
      setPage(1);
      setLastId(null);
    }, 300),
    []
  );

  const handleSearch = (e) => {
    debouncedSearch(e.target.value);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [key]: value,
    }));
    setPage(1);
    setLastId(null);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleResiliationClick = (resiliation) => {
    setSelectedPlainte(resiliation);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  return (
    <div className="resiliation-page">
      <Suspense fallback={<div>Chargement de la barre de navigation horizontale...</div>}>
        <NavbarHorizontal key="nav-horizontal" />
      </Suspense>

      <div className="top-buttons">
        <button onClick={() => window.location.href = '/resiliation-problemes'}>
          Accéder à la page des resiliation avec problème
        </button>
      </div>

      <div className="container_plt">
        <Suspense fallback={<div>Chargement de la barre de navigation verticale...</div>}>
          <NavbarVertical
            isVisible={isNavbarVisible}
            toggleNavbar={() => setIsNavbarVisible(!isNavbarVisible)}
          />
        </Suspense>


        <Suspense fallback={<div>Chargement du contenu...</div>}>
          <ResiliationsContent
            resiliation={viewWithProblem ? problemResiliations : resiliation}
            searchTerm={searchTerm}
            filters={filters}
            gouvernoratsTunisie={gouvernoratsTunisie}
            page={page}
            total={total}
            limit={limit}
            selectedPlainte={selectedPlainte}
            onSearchChange={handleSearch}
            onSearch={fetchResiliations}
            onFilterChange={handleFilterChange}
            onApplyFilters={fetchResiliations}
            onPageChange={handlePageChange}
            onResiliationClick={handleResiliationClick}
          />
        </Suspense>

        {/* Modal pour afficher les détails */}
        <Suspense fallback={<div>Chargement de la modal...</div>}>
          <ModalResiliation isOpen={isModalOpen} onClose={closeModal}>
            {selectedPlainte && <ResiliationDetails resiliation={selectedPlainte} />}
          </ModalResiliation>
        </Suspense>
      </div>
    </div>
  );
};

export default ResiliationsPage;
