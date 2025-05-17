import React, { useState, useRef, Suspense } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter } from '@fortawesome/free-solid-svg-icons';

import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { usePlaintesData } from './hooks/usePlaintesData';
import PlainteModal from './components/PlainteModal';
import PlainteTable from './components/PlainteTable';
import SearchBar from './components/SearchBar';
import './PlaintesProblemesPage.css';
import { BASE_API_URL } from '../../../../../config';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useEffect } from 'react';

const NavbarHorizontal = React.lazy(() => import('../../../../navbar/NavbarHorizontal'));
const NavbarVertical = React.lazy(() => import('../../../../navbar/NavbarVertical'));

const PlaintesProblemesPage = () => {
    const {
        problemPlaintes,
        loading,
        error,
        searchTerm,
        hasMore,
        isInitialLoad,
        fetchData,
        handleSearch,
        setProblemPlaintes,
        setError
    } = usePlaintesData();
    const normalizeString = (str) => {
        if (str === null || str === undefined) return '';
        return String(str).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    };
    const [isNavbarVisible, setIsNavbarVisible] = useState(true);
    const [selectedPlainte, setSelectedPlainte] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({});

    const handleSaveSuccess = (updatedData) => {
        setProblemPlaintes(prev =>
            prev.map(plainte =>
                plainte.crm_case === updatedData.crm_case ? updatedData : plainte
            )
        );

        fetchData(null, true);
    };
    const sentinelRef = useRef(null);

    const formatDateForSearch = (dateString) => {
        if (!dateString) return '';
        
        try {
            const date = new Date(dateString);
            // Format JJ/MM/AAAA
            return date.toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (e) {
            return '';
        }
    };
    const filteredPlaintes = problemPlaintes.filter(plainte => {
        if (!searchTerm.trim()) return true;
    
        const searchNormalized = normalizeString(searchTerm);
        const plainteValues = [
            plainte.crm_case?.toString(),
            plainte.Gouvernorat,
            plainte.Delegation,
            plainte.Description,
            plainte.Detail,
            plainte.CLIENT,
            plainte.MSISDN?.toString(),
            plainte.CONTACT_CLIENT?.toString(),
            plainte.CONTACT2_CLIENT?.toString(),
            plainte.STATUT?.toString(),
            // Ajoutez le formatage de date pour la recherche
            formatDateForSearch(plainte.DATE_CREATION_CRM),
            // Conservez aussi la date originale au cas où
            plainte.DATE_CREATION_CRM?.toString(),
            plainte.Offre?.toString(),
            plainte.DES_PACK?.toString()
        ].map(val => normalizeString(val));
    
        return plainteValues.some(val => val.includes(searchNormalized));
    });
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loading) {
                    fetchData();
                }
            },
            {
                root: null,
                rootMargin: '0px',
                threshold: 1.0,
            }
        );

        const sentinel = sentinelRef.current;
        if (sentinel) {
            observer.observe(sentinel);
        }

        return () => {
            if (sentinel) {
                observer.unobserve(sentinel);
            }
        };
    }, [sentinelRef, fetchData, hasMore, loading]);

    const handlePlainteClick = (plainte) => {
        setSelectedPlainte(plainte);
        setFormData({
            crm_case: plainte.crm_case,
            STATUT: plainte.STATUT,
            Detail: plainte.Detail,
            Gouvernorat: plainte.Gouvernorat,
            Delegation: plainte.Delegation,
            LATITUDE_SITE: plainte.LATITUDE_SITE,
            LONGITUDE_SITE: plainte.LONGITUDE_SITE,
            CLIENT: plainte.CLIENT,
            CONTACT_CLIENT: plainte.CONTACT_CLIENT,
            CONTACT2_CLIENT: plainte.CONTACT2_CLIENT,
            Offre: plainte.Offre,
            DES_PACK: plainte.DES_PACK,
            Description: plainte.Description,

        });
        setIsModalOpen(true);
        setEditMode(false);
    };

    return (
        <div className="plaintes-problemes-page">
            <Suspense fallback={<div className="loading-spinner"><FontAwesomeIcon icon={faSpinner} spin /></div>}>
                <NavbarHorizontal />
            </Suspense>
            <Suspense fallback={<div className="loading-spinner"><FontAwesomeIcon icon={faSpinner} spin /></div>}>
                <NavbarVertical
                    isVisible={isNavbarVisible}
                    toggleNavbar={() => setIsNavbarVisible(!isNavbarVisible)}
                />
            </Suspense>

            <div className={`main-contentPlaintePblem ${!isNavbarVisible ? 'expanded' : ''}`}>
                {error && (
                    <div className="error-message">
                        <FontAwesomeIcon icon={faExclamationTriangle} /> {error}
                    </div>
                )}

                <div className="search-filter-section">
                    <SearchBar
                        searchTerm={searchTerm}
                        onSearchChange={(e) => handleSearch(e.target.value)}
                        onSearch={() => handleSearch(searchTerm)}
                        loading={loading}
                        placeholder="Rechercher par client, MSISDN, référence..."
                    />
                </div>

                <PlainteTable
                    problemPlaintes={filteredPlaintes}
                    loading={loading}
                    hasMore={hasMore}
                    isInitialLoad={isInitialLoad}
                    handlePlainteClick={handlePlainteClick}
                    sentinelRef={sentinelRef}
                />

                <PlainteModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setEditMode(false);
                    }}
                    selectedPlainte={selectedPlainte}
                    editMode={editMode}
                    setEditMode={setEditMode}
                    formData={formData}
                    setFormData={setFormData}
                    onSaveSuccess={handleSaveSuccess}

                />
            </div>
        </div>
    );
};

export default PlaintesProblemesPage;