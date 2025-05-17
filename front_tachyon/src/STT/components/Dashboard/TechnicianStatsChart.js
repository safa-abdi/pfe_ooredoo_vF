import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../../styles/TechnicianStatsChart.css';

const TechnicianStatsChart = ({ data }) => {
    return (
        <div className="chart-container">
            <h2>Statistiques par Technicien</h2>
            <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="completed" fill="#82ca9d" name="Tâches Terminées" />
                    <Bar dataKey="blocked" fill="#ff8042" name="Tâches Bloquées" />
                    <Bar dataKey="canceled" fill="#8884d8" name="Tâches Annulées" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default TechnicianStatsChart;