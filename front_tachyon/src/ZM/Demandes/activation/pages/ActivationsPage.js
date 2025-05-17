import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { debounce } from 'lodash';
import './activationStyle.css';
import { BASE_API_URL } from '../../../../config';

const NavbarHorizontal = React.lazy(() => import('../../../navbar/NavbarHorizontal'));
const NavbarVertical = React.lazy(() => import('../../../navbar/NavbarVertical'));
const ActivationsContent = React.lazy(() => import('../component/ActivationsContent'));
const Modal = React.lazy(() => import('../component/Modal'));
const ActivationDetails = React.lazy(() => import('../component/ActivationDetails'));

const ActivationsPage = () => {
  const [activations, setActivations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const [selectedActivation, setSelectedActivation] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    REP_TRAVAUX_STT: 'non_affecté_stt',
    gouvernorat: '',
    delegation: '',
    DATE_AFFECTATION_STT: '',
    DES_PACK: '',
    offre: '',
    REP_RDV: '',
    DATE_PRISE_RDV: '',
    CMT_RDV: '',
    METRAGE_CABLE: '',
    STATUT: 'En cours',
  });
  const limit = 50;

  const gouvernoratsTunisie = [
    "Ariana", "Béja", "Ben Arous", "Bizerte", "Gabès", "Gafsa", "Jendouba", "Kairouan",
    "Kasserine", "Kébili", "Le Kef", "Mahdia", "La Manouba", "Médenine", "Monastir",
    "Nabeul", "Sfax", "Sidi Bouzid", "Siliana", "Sousse", "Tataouine", "Tozeur", "Tunis", "Zaghouan",
  ];

const [selectedActivations, setSelectedActivations] = useState([]);

  const fetchActivations = useCallback(async () => {
    try {
      const params = {
        searchTerm,
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      };

      const cleanedParams = Object.fromEntries(
        Object.entries(params).filter(([_, value]) => value !== '')
      );

      const queryString = new URLSearchParams(cleanedParams).toString();
      const response = await fetch(`${BASE_API_URL}/activation/all?${queryString}`);

      if (!response.ok) throw new Error('Erreur réseau');

      const result = await response.json();

      if (result?.data && Array.isArray(result.data)) {
        setActivations(result.data);
        setTotal(result.total);
      } else {
        throw new Error('Format de données invalide');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setActivations([]);
      setTotal(0);
    }
  }, [searchTerm, page, limit, filters]);
  useEffect(() => {
    fetchActivations();
  }, [fetchActivations]);

  const debouncedSearch = useCallback(
    debounce((term) => {
      setSearchTerm(term);
      setPage(1);
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
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleActivationClick = (activation) => {
    setSelectedActivation(activation);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="activations-page">
      <Suspense fallback={<div>Chargement de la barre de navigation horizontale...</div>}>
        <NavbarHorizontal key="nav-horizontal" />
      </Suspense>

      <div className="container_act">
        <Suspense fallback={<div>Chargement de la barre de navigation verticale...</div>}>
          <NavbarVertical
            isVisible={isNavbarVisible}
            toggleNavbar={() => setIsNavbarVisible(!isNavbarVisible)}
          />
        </Suspense>

        <Suspense fallback={<div>Chargement du contenu...</div>}>
          <ActivationsContent
            activations={activations}
            searchTerm={searchTerm}
            filters={filters}
            gouvernoratsTunisie={gouvernoratsTunisie}
            page={page}
            total={total}
            limit={limit}
            selectedActivation={selectedActivation}
            onSearchChange={handleSearch}
            onSearch={fetchActivations}
            onFilterChange={handleFilterChange}
            onApplyFilters={fetchActivations}
            onPageChange={handlePageChange}
            onActivationClick={handleActivationClick}
            setSelectedActivations={setSelectedActivations}

          />
        </Suspense>

        {/* Modal pour afficher les détails */}
        <Suspense fallback={<div>Chargement de la modal...</div>}>
          <Modal isOpen={isModalOpen} onClose={closeModal}>
            <ActivationDetails activation={selectedActivation} />
          </Modal>
        </Suspense>

      </div>
    </div>
  );
};

export default ActivationsPage;