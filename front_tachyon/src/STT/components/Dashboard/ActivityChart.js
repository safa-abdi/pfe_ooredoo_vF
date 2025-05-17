import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../../styles/ActivityChart.css';

const ActivityChart = ({ data }) => {
    return (
        <div className="chart-container">
            <h2>Activité Hebdomadaire par Technicien</h2>
            <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Jean Dupont.completed" fill="#8884d8" name="Jean Dupont (Terminées)" />
                    <Bar dataKey="Jean Dupont.remaining" fill="#82ca9d" name="Jean Dupont (Restantes)" />
                    <Bar dataKey="Marie Curie.completed" fill="#ff8042" name="Marie Curie (Terminées)" />
                    <Bar dataKey="Marie Curie.remaining" fill="#ffbb28" name="Marie Curie (Restantes)" />
                    <Bar dataKey="Pierre Durand.completed" fill="#0088fe" name="Pierre Durand (Terminées)" />
                    <Bar dataKey="Pierre Durand.remaining" fill="#00c49f" name="Pierre Durand (Restantes)" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ActivityChart;