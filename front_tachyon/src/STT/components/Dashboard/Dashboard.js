import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../navbar/Navbar';
import Sidebar from '../navbar/Sidebar';
import TaskDistributionChart from './TaskDistributionChart';
import SLAStatsChart from './SLAStatsChart';
import './Dashboard.css';
import useUserData from '../hooks/useUserData';

const Dashboard = () => {
    const { user } = useUserData();
    const [slaData, setSlaData] = useState(null);
    const [activationData, setActivationData] = useState(null);
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

                const branchesRequest = axios.get(`http://localhost:3000/branches/getBycompany/${companyId}`);

                const [slaResponse, activationResponse, branchesResponse] = await Promise.all([
                    slaRequest,
                    activationRequest,
                    branchesRequest
                ]);

                const filteredSlaData = {
                    ...slaResponse.data,
                    details: slaResponse.data.details.filter(item => item.group_by === companyName)
                };
                setSlaData(filteredSlaData);

                const filteredActivationData = activationResponse.data.data.filter(item => item.stt === companyName);
                setActivationData(filteredActivationData);

                setBranches(branchesResponse.data);

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


    if (loading) return <div className="loading">Chargement en cours...</div>;
    if (error) return <div className="error">Erreur: {error}</div>;

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

    return (
        <div className="dashboard-container">
            <Navbar />
            <Sidebar />

            <div className="main-content">

                <div className="stats-summary">


                    {activationData && (
                        <div className="stats-card">
                            <h3>Total Activations</h3>
                            <p>{activationData.reduce((sum, item) => sum + item.total, 0)}</p>
                        </div>
                    )}
                </div>

                <div className="charts-section">
                    {activationData && activationData.length > 0 && (
                        <TaskDistributionChart data={prepareTaskDistributionData()} />
                    )}

                    {slaData && slaData.details.length > 0 && (
                        <SLAStatsChart data={prepareSLAData()} />
                    )}
                </div>

                {branches.length > 0 && (
                    <div className="branches-section">
                        <h2>Branches de l'Entreprise</h2>
                        <div className="branches-grid">
                            {branches.map(branch => (
                                <div key={branch.id} className="branch-card">
                                    <h3>{branch.name}</h3>
                                    <p>Gouvernorat: {branch.governorate}</p>
                                    <p>Contact: {branch.contact || 'Non disponible'}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;