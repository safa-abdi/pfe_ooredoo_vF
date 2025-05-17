import React, { useState, useEffect } from 'react';
import axios from 'axios';
import NavbarHorizontal from '../../navbar/NavbarHorizontal';
import NavbarVertical from '../../navbar/NavbarVertical';
import BranchModal from './BranchModal';
import AddCompanyModal from './AddCompanyModal';
import StatsSection from './StatsSection';
import ChartSection from './ChartSection';
import ManagementSection from './ManagementSection';
import ConfirmationModal from './ConfirmationSuppModal ';
import EditCompanyModal from './EditCompanyModal';
import '../ListSTT.css';
import { FaTimes } from 'react-icons/fa';

const ListSTT = () => {
    const [isNavbarVisible, setIsNavbarVisible] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [subcontractors, setSubcontractors] = useState([]);
    const [Allbranches, setAllbranches] = useState([]);
    const [blockedCompanies, setBlockedCompanies] = useState([]);
    const [blockedBranches, setBlockedBranches] = useState([]);
    const [branches, setBranches] = useState([]);
    const [selectedSTT, setSelectedSTT] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAddCompanyModalOpen, setIsAddCompanyModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [showBlockedModal, setShowBlockedModal] = useState(false);
    const [stats, setStats] = useState({
        totalSTT: 0,
        mostDelayedSTT: {},
        mostActiveSTT: {},
        blockedCompanies: [],
        blockedBranches: []
    });
    useEffect(() => {
        axios.get('http://localhost:3000/activation/stt/highest-average-delay')
            .then(response => {
                setStats(prev => ({
                    ...prev,
                    mostDelayedSTT: {
                        sttName: response.data.sttName,
                        averageDelayHours: response.data.averageDelayHours
                    }
                }));
            })
            .catch(error => console.error("Erreur fetching delayed STT:", error));

    }, []);


    const [currentView, setCurrentView] = useState(() => {
        return localStorage.getItem('currentView') || 'stats';
    });
    const toggleBlockedModal = () => {
        setShowBlockedModal(!showBlockedModal);
    };
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const openEditModal = (company) => {
        setSelectedCompany(company);
        setIsEditModalOpen(true);
    };
    const fetchBlockedCompanies = async () => {
        try {
            const response = await axios.get('http://localhost:3000/companies/blocked');
            setBlockedCompanies(response.data);
        } catch (error) {
            console.error("Erreur lors de la récupération des companies bloquées", error);
        }
    };

    const BlockedModal = ({ isOpen, onClose, blockedCompanies, blockedBranches }) => {
        if (!isOpen) return null;

        return (
            <div className="modal-overlay_block">
                <div className="modal-content_block">
                    <button className="close-btn" onClick={onClose}>
                        <FaTimes />
                    </button>
                    <h2>STT bloqués</h2>

                    <div className="blocked-list">
                        {blockedCompanies.length > 0 ? (
                            <ul>
                                {blockedCompanies.map(company => (
                                    <li key={company.id}>{company.name}</li>
                                ))}
                            </ul>
                        ) : (
                            <p> </p>
                        )}

                        {blockedBranches.length > 0 ?
                            (
                                <ul>
                                    {blockedBranches.map(branch => (
                                        <li key={branch.id}>{branch.governorate}_{branch.company_name}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p>Aucune branche bloquée.</p>
                            )}
                    </div>
                </div>
            </div>
        );
    };
    const fetchBlockedBranches = async () => {
        try {
            const response = await axios.get('http://localhost:3000/branches/blocked');
            setBlockedBranches(response.data);
        } catch (error) {
            console.error("Erreur lors de la récupération des branches bloquées", error);
        }
    };
    useEffect(() => {
        fetchSubcontractors();
        fetchAllBranches();
        fetchBlockedCompanies();
        fetchBlockedBranches();

    }, []);

    useEffect(() => {
        localStorage.setItem('currentView', currentView);
    }, [currentView]);

    const fetchSubcontractors = async () => {
        try {
            const response = await axios.get('http://localhost:3000/companies/STT');
            const data = response.data.map(sub => ({
                ...sub,
                adresse: sub.adresse || "",
                contact: sub.contact || "",
            }));
            setSubcontractors(data);
        } catch (error) {
            console.error("Erreur lors de la récupération des STT", error);
        }
    };

    const fetchAllBranches = async () => {
        try {
            const response = await axios.get('http://localhost:3000/branches');
            setAllbranches(response.data);
        } catch (error) {
            console.error("Erreur lors de la récupération des branches", error);
        }
    };

    const fetchBranches = async (id) => {
        try {
            const response = await axios.get(`http://localhost:3000/branches/getBycompany/${id}`);
            setBranches(response.data);
            setSelectedSTT(id);
            setIsModalOpen(true);
        } catch (error) {
            console.error("Erreur lors de la récupération des branches", error);
        }
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`http://localhost:3000/companies/${id}`);
            fetchSubcontractors();
        } catch (error) {
            console.error("Erreur lors de la suppression", error);
        }
    };

    const handleAddCompany = async (newCompany) => {
        setSubcontractors([...subcontractors, newCompany]);
    };

    const filteredSubcontractors = subcontractors.filter(sub => {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();

        return (
            (sub.name && sub.name.toLowerCase().includes(lowerCaseSearchTerm)) ||
            (sub.adresse && sub.adresse.toLowerCase().includes(lowerCaseSearchTerm)) ||
            (sub.contact && sub.contact.toLowerCase().includes(lowerCaseSearchTerm))
        );
    });

    const totalSTT = subcontractors.length;
    const mostActiveSTT = subcontractors.reduce((prev, current) =>
        prev.workCompleted > current.workCompleted ? prev : current, { workCompleted: 0 }
    );


    const chartData = subcontractors.map(sub => ({
        name: sub.name,
        Complété: sub.workCompleted || 0,
        'En cours': sub.inprogress || 0,
        Abandonné: sub.refused || 0,
    }));

    const openDeleteModal = (id) => {
        setItemToDelete(id);
        setDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        handleDelete(itemToDelete);
        setDeleteModalOpen(false);
        setItemToDelete(null);
    };

    const cancelDelete = () => {
        setDeleteModalOpen(false);
        setItemToDelete(null);
    };

    return (
        <div className="container5">
            <NavbarHorizontal />
            <div className="main-content5">
                <NavbarVertical isVisible={isNavbarVisible} toggleNavbar={() => setIsNavbarVisible(!isNavbarVisible)} />

                <div className="report-section2">
                    <div className="view-switcher">
                        <button
                            className={`view-btn ${currentView === 'stats' ? 'active' : ''}`}
                            onClick={() => setCurrentView('stats')}
                        >
                            Statistiques
                        </button>
                        <button
                            className={`view-btn ${currentView === 'management' ? 'active' : ''}`}
                            onClick={() => setCurrentView('management')}
                        >
                            Gestion des STT
                        </button>
                    </div>
{currentView === 'stats' && (
    <div className="stats-chart-container">
                <ChartSection chartData={chartData} />
        <StatsSection
            totalSTT={totalSTT}
            mostActiveSTT={mostActiveSTT}
            mostDelayedSTT={stats.mostDelayedSTT}
            blockedCompanies={blockedCompanies}
            blockedBranches={blockedBranches}
            toggleBlockedModal={toggleBlockedModal}
        />
    </div>
)}


                    {currentView === 'management' && (
                        <ManagementSection
                            searchTerm={searchTerm}
                            onSearchChange={(e) => setSearchTerm(e.target.value)}
                            onAddCompany={() => setIsAddCompanyModalOpen(true)}
                            filteredSubcontractors={filteredSubcontractors}
                            onDelete={openDeleteModal}
                            onViewBranches={fetchBranches}
                            onEdit={openEditModal}
                        />
                    )}
                </div>
            </div>

            {/* Modale pour afficher les branches */}
            <BranchModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                branches={branches}
                selectedSTT={selectedSTT}
                subcontractors={subcontractors}
                fetchSubcontractors={fetchSubcontractors}
                fetchBranches={fetchBranches}
                fetchAllBranches={fetchAllBranches}
            />

            {/* Modale pour ajouter une nouvelle entreprise */}
            <AddCompanyModal
                isOpen={isAddCompanyModalOpen}
                onClose={() => setIsAddCompanyModalOpen(false)}
                onCompanyAdded={handleAddCompany}
            />

            {/* Modale de confirmation de suppression */}
            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={cancelDelete}
                onConfirm={confirmDelete}
                message="Êtes-vous sûr de vouloir supprimer cet élément ?"
            />

            {/* Modale pour éditer une entreprise */}
            <EditCompanyModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                company={selectedCompany}
                onCompanyUpdated={(updatedCompany) => {
                    setSubcontractors(subcontractors.map(sub =>
                        sub.id === updatedCompany.id ? updatedCompany : sub
                    ));
                }}
            />
            <BlockedModal
                isOpen={showBlockedModal}
                onClose={toggleBlockedModal}
                blockedCompanies={blockedCompanies}
                blockedBranches={blockedBranches}
            />
        </div>
    );
};

export default ListSTT;