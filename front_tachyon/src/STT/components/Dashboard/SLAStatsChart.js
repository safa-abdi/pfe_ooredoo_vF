import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './SLAStatsChart.css';

const SLAStatsChart = ({ data }) => {
    return (
        <div className="chart-container">
            <h2>Performances SLA par Équipe</h2>
            <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data}>
                    <XAxis dataKey="name" />
                    <YAxis label={{ value: 'Pourcentage', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="avg_sla" fill="#8884d8" name="SLA Moyen (%)" />
                    <Bar dataKey="avg_temps_rdv" fill="#82ca9d" name="Temps Moyen RDV (h)" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default SLAStatsChart;