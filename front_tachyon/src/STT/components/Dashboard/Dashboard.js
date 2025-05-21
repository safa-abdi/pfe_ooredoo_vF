import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../navbar/Navbar';
import Sidebar from '../navbar/Sidebar';
import TaskDistributionChart from './TaskDistributionChart';
import SLAStatsChart from './SLAStatsChart';
import TechnicianPerformanceChart from './TechnicianPerformanceChart';
import './Dashboard.css';
import useUserData from '../hooks/useUserData';

const Dashboard = () => {
    const { user } = useUserData();
    const [slaData, setSlaData] = useState(null);
    const [activationData, setActivationData] = useState(null);
    const [plainteData, setPlainteData] = useState(null);
    const [resiliationData, setResiliationData] = useState(null);

    const [techniciansData, setTechniciansData] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const companyId = user?.company?.id;
                const companyName = user?.company?.name;

                const slaRequest = axios.get(`http://localhost:3000/activation/sla/stt`, {
                    params: { companyId }
                });

                const activationRequest = axios.get(`http://localhost:3000/activation/paginated`, {
                    params: { page: 1, limit: 50, companyId }
                });

                const plainteRequest = axios.get(`http://localhost:3000/plainte/paginated`, {
                    params: { page: 1, limit: 50, companyId }
                });

                 const resiliationRequest = axios.get(`http://localhost:3000/resiliation/paginated`, {
                    params: { page: 1, limit: 50, companyId }
                });
                const branchesRequest = axios.get(`http://localhost:3000/branches/getBycompany/${companyId}`);

                const techniciansRequest = axios.get(`http://localhost:3000/branches/moyenne-prise-rdv/${companyId}`);

                const [slaResponse, activationResponse, plainteResponse,resiliationResponse, branchesResponse, techniciansResponse] = await Promise.all([
                    slaRequest,
                    activationRequest,
                    plainteRequest,
                    resiliationRequest,
                    branchesRequest,
                    techniciansRequest
                ]);

                const filteredSlaData = {
                    ...slaResponse.data,
                    details: slaResponse.data.details.filter(item => item.group_by === companyName)
                };
                setSlaData(filteredSlaData);

                const filteredActivationData = activationResponse.data.data.filter(item => item.stt === companyName);
                setActivationData(filteredActivationData);

                const filteredPlainteData = plainteResponse.data.data.filter(item => item.stt === companyName);
                setPlainteData(filteredPlainteData);

                const filteredResiliationData = resiliationResponse.data.data.filter(item => item.stt === companyName);
                setResiliationData(filteredResiliationData);

                setBranches(branchesResponse.data);
                setTechniciansData(techniciansResponse.data);

                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        if (user?.company?.id) {
            fetchData();
        }
    }, [user]);

    if (loading) return (
        
        <div className="dashboard-loading">
             <div className="spinner-container">
    <div className="spinner-ring"></div>
  </div>

        </div>
    );

    if (error) return (
        <div className="dashboard-error">
            <div className="error-icon">!</div>
            <h3>Erreur de chargement</h3>
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>Réessayer</button>
        </div>
    );

    const prepareTaskDistributionData = () => {
        if (!activationData) return [];
        return [{
            name: user?.company?.name || 'Votre entreprise',
            total: activationData.reduce((sum, item) => sum + item.total, 0),
            terminated: activationData.reduce((sum, item) => sum + item.terminated, 0),
            inProgress: activationData.reduce((sum, item) => sum + item.inProgress, 0),
            abandoned: activationData.reduce((sum, item) => sum + item.abandoned, 0)
        }];
    };

    const prepareSLAData = () => {
        if (!slaData) return [];
        return slaData.details.map(item => ({
            name: item.group_by,
            avg_sla: item.avg_sla_stt,
            avg_temps_rdv: item.avg_temps_rdv
        }));
    };

    const prepareTechniciansData = () => {
        if (!techniciansData || techniciansData.length === 0) return [];

        const data = techniciansData.map(tech => ({
            name: tech.technicienNom,
            activation: tech.moyenneActivation || 0,
            complaint: tech.moyennePlainte || 0,
            termination: tech.moyenneResiliation || 0,
        }));

        return data.sort((a, b) => {
            const aHasValue = a.activation > 0 || a.complaint > 0 || a.termination > 0;
            const bHasValue = b.activation > 0 || b.complaint > 0 || b.termination > 0;

            if (aHasValue && !bHasValue) return -1;
            if (!aHasValue && bHasValue) return 1;
            return 0;
        });
    };

    return (
        <div className="dashboard-containerDashStt">
            <Navbar />
            <Sidebar />
            <div className="main-contentDashStt">
                <div className="dashboard-headerDashStt">
                    <div>
                        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 13H11V3H3V13ZM3 21H11V15H3V21ZM13 21H21V11H13V21ZM13 3V9H21V3H13Z" fill="var(--primary)" />
                            </svg>
                        </h1>

                    </div>
                    <div className="header-stats">
                        {activationData && (
                            <div className="stat-badge" style={{ borderLeftColor: 'var(--secondary)' }}>
                                <span>Activations en cours</span>
                                <strong>{activationData.reduce((sum, item) => sum + item.inProgress, 0).toLocaleString()}</strong>
                            </div>
                        )}
                        {plainteData && (
                            <div className="stat-badge" style={{ borderLeftColor: 'var(--success)' }}>
                                <span>Plaintes en cours</span>
                                <strong>{plainteData.reduce((sum, item) => sum + item.inProgress, 0).toLocaleString()}</strong>
                            </div>
                        )}
                         {resiliationData && (
                            <div className="stat-badge" style={{ borderLeftColor: 'var(--dark-light)' }}>
                                <span>Résiliations en cours</span>
                                <strong>{resiliationData.reduce((sum, item) => sum + item.inProgress, 0).toLocaleString()}</strong>
                            </div>
                        )}
                        {slaData && (
                            <div className="stat-badge" style={{ borderLeftColor: 'var(--danger)' }}>
                                <span>SLA Moyen</span>
                                <strong>{slaData.details[0]?.avg_sla_stt?.toFixed(2)}%</strong>
                            </div>
                        )}
                        {techniciansData.length > 0 && (
                            <div className="stat-badge" style={{ borderLeftColor: 'var(--warning)' }}>
                                <span>Techniciens</span>
                                <strong>{techniciansData.length}</strong>
                            </div>
                        )}
                        {branches.length > 0 && (
                            <div className="stat-badge" style={{ borderLeftColor: 'var(--danger)' }}>
                                <span>Branches</span>
                                <strong>{branches.length}</strong>
                            </div>
                        )}
                    </div>
                </div>

                <div className="dashboardStt-grid--technician-first">
                    <div className="card chart-cardDashStt">
                        {techniciansData.length > 0 ? (
                            <TechnicianPerformanceChart data={prepareTechniciansData()} />
                        ) : (
                            <div className="no-data-message">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M11 15H13V17H11V15ZM11 7H13V13H11V7ZM11.99 2C6.47 2 2 6.48 2 12C2 17.52 6.47 22 11.99 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 11.99 2ZM12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20Z" fill="var(--gray-light)" />
                                </svg>
                                <p>Aucune donnée de technicien disponible</p>
                            </div>
                        )}
                    </div>

                    {/* Deuxième carte - Task Distribution */}
                    <div className="card chart-cardDashStt">
                        {activationData && activationData.length > 0 ? (
                            <TaskDistributionChart data={prepareTaskDistributionData()} />
                        ) : (
                            <div className="no-data-message">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="..." />
                                </svg>
                                <p>Aucune donnée d'activation disponible</p>
                            </div>
                        )}
                    </div>

                    <div className="card chart-cardDashStt">
                        {slaData && slaData.details.length > 0 ? (
                            <SLAStatsChart data={prepareSLAData()} />
                        ) : (
                            <div className="no-data-message">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="..." />
                                </svg>
                                <p>Aucune donnée SLA disponible</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;