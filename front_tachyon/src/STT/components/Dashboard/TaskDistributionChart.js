import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import './TaskDistributionChart.css';

const TaskDistributionChart = ({ data }) => {
    // Couleurs personnalisées pour chaque barre
    const colors = {
        total: '#6366f1',
        terminated: '#10b981',
        inProgress: '#f59e0b',
        abandoned: '#ef4444'
    };

    // Format personnalisé pour la tooltip
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="custom-tooltip">
                    <h3 className="tooltip-title">{label}</h3>
                    <ul className="tooltip-list">
                        {payload.map((entry, index) => (
                            <li key={`item-${index}`} style={{ color: entry.color }}>
                                {entry.name}: <strong>{entry.value}</strong>
                            </li>
                        ))}
                    </ul>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="chart-container">
            <h2 className="chart-title">Répartition des Activations par Équipe</h2>
            <p className="chart-subtitle">Visualisation des tâches par statut et par équipe</p>
            
            <ResponsiveContainer width="100%" height={400}>
                <BarChart
                    data={data}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    barGap={10}
                    barCategoryGap="20%"
                >
                    <XAxis 
                        dataKey="name" 
                        angle={-45} 
                        textAnchor="end" 
                        height={70}
                        tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                        tick={{ fontSize: 12 }}
                        label={{ 
                            value: 'Nombre de tâches', 
                            angle: -90, 
                            position: 'insideLeft',
                            fontSize: 14
                        }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                        verticalAlign="top" 
                        height={50}
                        wrapperStyle={{ paddingBottom: 20 }}
                    />
                    <Bar dataKey="total" name="Total" radius={[4, 4, 0, 0]}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={colors.total} />
                        ))}
                    </Bar>
                    <Bar dataKey="terminated" name="Terminées" radius={[4, 4, 0, 0]}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={colors.terminated} />
                        ))}
                    </Bar>
                    <Bar dataKey="inProgress" name="En Cours" radius={[4, 4, 0, 0]}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={colors.inProgress} />
                        ))}
                    </Bar>
                    <Bar dataKey="abandoned" name="Abandonnées" radius={[4, 4, 0, 0]}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={colors.abandoned} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
            
            <div className="chart-footer">
                <p>Dernière mise à jour: {new Date().toLocaleDateString()}</p>
            </div>
        </div>
    );
};

export default TaskDistributionChart;