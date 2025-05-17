import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './ActivationStatsChart.css';

const ActivationStatsChart = ({ data }) => {
    return (
        <div className="activation-stats-chart">
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="terminated" fill="#28a745" name="Terminées" />
                    <Bar dataKey="inProgress" fill="#ffc107" name="En Cours" />
                    <Bar dataKey="abandoned" fill="#dc3545" name="Abandonnées" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ActivationStatsChart;