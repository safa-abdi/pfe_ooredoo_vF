import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
    LineChart, Line, XAxis, YAxis, Tooltip, Legend,
    ResponsiveContainer, CartesianGrid, Brush, BarChart, Bar
} from 'recharts';
import { Spin, Alert, Card, Statistic, Row, Col, Tabs, Select } from 'antd';
import './ChartSection.css';

const { TabPane } = Tabs;
const { Option } = Select;

const ChartSection = () => {
    const [data, setData] = useState({
        activation: [],
        total: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState(null);
    const [activeTab, setActiveTab] = useState('activation');
    const [viewMode, setViewMode] = useState('lines');

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                const activationRes = await axios.get('http://localhost:3000/activation/paginated', {
                    params: { page: 1, limit: 1000 }
                });

                const activationData = activationRes.data.data
                    .filter(item => item.stt?.trim())
                    .map(item => ({
                        name: item.stt,
                        type: 'activation',
                        Complété: item.terminated || 0,
                        'En cours': item.inProgress || 0,
                        Abandonné: item.abandoned || 0,
                        Total: (item.terminated || 0) + (item.inProgress || 0) + (item.abandoned || 0)
                    }));

                const totalData = [...activationData];

                const globalStats = {
                    activation: activationData.reduce((sum, item) => sum + item.Total, 0),
                    plaintes: 0,
                    résiliation: 0,
                    total: totalData.reduce((sum, item) => sum + item.Total, 0),
                    totalSTT: new Set(activationData.map(item => item.name)).size
                };

                setData({
                    activation: activationData,
                    total: totalData
                });
                setStats(globalStats);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const currentData = useMemo(() => data[activeTab] || [], [data, activeTab]);
    const isTotalView = activeTab === 'total';

    const topPerformers = useMemo(() => {
        return [...currentData]
            .sort((a, b) => b.Total - a.Total)
            .slice(0, 5);
    }, [currentData]);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const total = payload.reduce((sum, entry) => sum + (entry.value || 0), 0);
            return (
                <div className="custom-tooltip">
                    <p className="label"><strong>{label}</strong></p>
                    <p className="total">Total: {total}</p>
                    {payload.map((entry, index) => (
                        <p key={`item-${index}`} style={{ color: entry.color }}>
                            {entry.name}: {entry.value} {total > 0 ? Math.round((entry.value / total) * 100) : 0}%
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    const renderChart = () => {
        return (
            <ResponsiveContainer width="100%" height={350}>
                {viewMode === 'bars' && !isTotalView ? (
                    <BarChart data={currentData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis
                            dataKey="name"
                            angle={-45}
                            textAnchor="end"
                            height={70}
                            tick={{ fontSize: currentData.length > 50 ? 8 : 10 }}
                        />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar dataKey="Complété" fill="#a5dbdb" name="Complété" />
                        <Bar dataKey="En cours" fill="#47bfaf" name="En cours" />
                        <Bar dataKey="Abandonné" fill="#00402F" name="Abandonné" />
                        <Brush
                            dataKey="name"
                            height={30}
                            stroke="#d1d3d4"
                            fill="#d1d3d4"
                            startIndex={0}
                            endIndex={Math.min(20, currentData.length - 1)}
                            y={320}
                            travellerWidth={10}
                            gap={5}
                            travellerStyle={{
                                stroke: '#d1d3d4',
                                fill: '#d1d3d4'
                            }}
                            style={{
                                background: '#d1d3d4'
                            }}
                        />
                    </BarChart>
                ) : (
                    <LineChart
                        data={currentData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 80 }} 
                    >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis
                            dataKey="name"
                            angle={-45}
                            textAnchor="end"
                            height={70}
                            tick={{ fontSize: currentData.length > 50 ? 8 : 10 }}
                            interval={Math.floor(currentData.length / 20)}
                        />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        {isTotalView ? (
                            <Line
                                type="monotone"
                                dataKey="Total"
                                stroke="#8884d8"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 6 }}
                            />
                        ) : (
                            <>
                                <Line
                                    type="monotone"
                                    dataKey="Complété"
                                    stroke="#a5dbdb"
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 6 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="En cours"
                                    stroke="#47bfaf"
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 6 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="Abandonné"
                                    stroke="#00402F"
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 6 }}
                                />
                            </>
                        )}
                        <Brush
                            dataKey="name"
                            height={30}
                            stroke="#d1d3d4"
                            fill="#d1d3d4"
                            startIndex={0}
                            endIndex={Math.min(20, currentData.length - 1)}
                            y={320}
                            travellerWidth={10}
                            gap={5}
                            travellerStyle={{
                                stroke: '#d1d3d4',
                                fill: '#d1d3d4'
                            }}
                            style={{
                                background: '#d1d3d4'
                            }}
                        />

                    </LineChart>
                )}
            </ResponsiveContainer>
        );
    };

    if (loading) return <Spin size="large" tip="Chargement des données..." />;

    if (error) return (
        <Alert
            message="Erreur"
            description={`Erreur lors du chargement: ${error}`}
            type="error"
            showIcon
        />
    );

    return (
        <div className="chart-section-container">

            <div className="chart-controls">
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    tabBarExtraContent={
                        <Select value={viewMode} onChange={setViewMode} style={{ width: 120 }}>
                            <Option value="lines">Lignes</Option>
                            <Option value="bars">Barres</Option>
                        </Select>
                    }
                >
                    <TabPane tab="Activations" key="activation" />
                    <TabPane tab="Plaintes" key="plaintes" disabled />
                    <TabPane tab="Résiliations" key="résiliation" disabled />
                    <TabPane tab="Vue Totale" key="total" />
                </Tabs>
            </div>

            <Card className="chart-card">
                {renderChart()}
            </Card>
        </div>
    );
};

export default ChartSection;