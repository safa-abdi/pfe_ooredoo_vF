import React, { useState, useEffect, Suspense, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';
import '../plainteStyle.css';
import { BASE_API_URL } from '../../../../config';

const NavbarHorizontal = React.lazy(() => import('../../../navbar/NavbarHorizontal'));
const NavbarVertical = React.lazy(() => import('../../../navbar/NavbarVertical'));
const PlaintesContent = React.lazy(() => import('../component/PlaintesContent'));
const ModalPlainte = React.lazy(() => import('../component/ModalPlainte'));
const PlainteDetails = React.lazy(() => import('../component/PlainteDetails'));

const PlaintesPage = () => {
  const [plaintes, setPlaintes] = useState([]);
  const [problemPlaintes, setProblemPlaintes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const [selectedPlainte, setSelectedPlainte] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    STATUT: 'En cours',
    gouvernorat: '',
    delegation: '',
    DATE_CREATION: '',
    TYPE_PLAINTE: '',
    SOURCE_PLAINTE: '',
    PRIORITE: '',
    CRM_CASE: '',
    REP_TRAVAUX_STT: 'non_affecté_stt',

  });
  const [lastId, setLastId] = useState(null);
  const [viewWithProblem, setViewWithProblem] = useState(false);
  const limit = 50;

  const gouvernoratsTunisie = [
    "Ariana", "Béja", "Ben Arous", "Bizerte", "Gabès", "Gafsa", "Jendouba", "Kairouan",
    "Kasserine", "Kébili", "Le Kef", "Mahdia", "La Manouba", "Médenine", "Monastir",
    "Nabeul", "Sfax", "Sidi Bouzid", "Siliana", "Sousse", "Tataouine", "Tozeur", "Tunis", "Zaghouan",
  ];

  const fetchProblemPlaintes = useCallback(async () => {
    try {
      const params = { page: page.toString(), limit: limit.toString(), lastId };
      const queryString = new URLSearchParams(params).toString();
      const url = `${BASE_API_URL}/plainte/problemes?${queryString}`;

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Erreur lors de la récupération des plaintes avec problème');

      const result = await response.json();
      setProblemPlaintes(result.data || []);
    } catch (error) {
      console.error('Erreur:', error);
      setProblemPlaintes([]);
    }
  }, [page, limit, lastId]);

  const fetchPlaintes = useCallback(async () => {
    try {
      const params = { searchTerm: searchTerm.trim(), page: page.toString(), limit: limit.toString(), lastId, ...filters };
      const cleanedParams = Object.fromEntries(Object.entries(params).filter(([_, value]) => value));
      const queryString = new URLSearchParams(cleanedParams).toString();
      const url = `${BASE_API_URL}/plainte/valid?${queryString}`;

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur HTTP: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (result && Array.isArray(result.data)) {
        setPlaintes(result.data);
        setTotal(result.total || result.data.length);
        if (result.pagination?.nextCursor) {
          setLastId(result.pagination.nextCursor);
        } else {
          setLastId(null);
        }
      } else {
        throw new Error('Format de données invalide');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setPlaintes([]);
      setTotal(0);
      setLastId(null);
    }
  }, [searchTerm, page, limit, lastId, filters]);

  useEffect(() => {
    fetchPlaintes();
    fetchProblemPlaintes();
  }, [fetchPlaintes, fetchProblemPlaintes]);

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

  const handlePlainteClick = (plainte) => {
    setSelectedPlainte(plainte);
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
    <div className="plaintes-page">
      <Suspense fallback={<div>Chargement de la barre de navigation horizontale...</div>}>
        <NavbarHorizontal key="nav-horizontal" />
      </Suspense>

      <div className="top-buttons">
        <button onClick={() => window.location.href = '/plaintes-problemes'}>
          Accéder à la page des plaintes avec problème
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
          <PlaintesContent
            plaintes={viewWithProblem ? problemPlaintes : plaintes}
            searchTerm={searchTerm}
            filters={filters}
            gouvernoratsTunisie={gouvernoratsTunisie}
            page={page}
            total={total}
            limit={limit}
            selectedPlainte={selectedPlainte}
            onSearchChange={handleSearch}
            onSearch={fetchPlaintes}
            onFilterChange={handleFilterChange}
            onApplyFilters={fetchPlaintes}
            onPageChange={handlePageChange}
            onPlainteClick={handlePlainteClick}
          />
        </Suspense>

        {/* Modal pour afficher les détails */}
        <Suspense fallback={<div>Chargement de la modal...</div>}>
          <ModalPlainte isOpen={isModalOpen} onClose={closeModal}>
            {selectedPlainte && <PlainteDetails plainte={selectedPlainte} />}
          </ModalPlainte>
        </Suspense>
      </div>
    </div>
  );
};

export default PlaintesPage;
