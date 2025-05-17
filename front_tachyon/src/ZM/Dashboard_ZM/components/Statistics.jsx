import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

const filterDataByDate = (data, startDate, endDate, selectedDate) => {
    return data.filter(item => {
        const creationDate = new Date(item.date_creation_crm).toISOString().split('T')[0];
        if (startDate && endDate) {
            return creationDate >= startDate && creationDate <= endDate;
        }
        if (selectedDate) {
            return creationDate === selectedDate;
        }
        return true;
    });
};

const Statistics = ({ selectedDate, startDate, endDate, activations, plaintes, resiliations }) => {
    const filteredActivations = filterDataByDate(activations, startDate, endDate, selectedDate);
    const filteredPlaintes = filterDataByDate(plaintes, startDate, endDate, selectedDate);
    const filteredResiliations = filterDataByDate(resiliations, startDate, endDate, selectedDate);

    const chartData = [
        { name: 'Activations', value: filteredActivations.length },
        { name: 'Plaintes', value: filteredPlaintes.length },
        { name: 'Résiliations', value: filteredResiliations.length },
    ];

    return (
        <div style={{
            width: '300px',
            height: '730px',
            padding: '20px',
            backgroundColor: '#fff',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            borderRadius: '8px',
            margin: '20px',
            marginTop: '30px'
        }}>
            <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>Statistiques</h3>
            {chartData.reduce((acc, item) => acc + item.value, 0) > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            dataKey="value"
                            labelLine={false}
                            label={({ percent }) => `${(percent * 100).toFixed(2)}%`}
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            ) : (
                <p style={{ textAlign: 'center', color: '#888' }}>Aucune donnée disponible pour cette sélection.</p>
            )}
        </div>
    );
};

export default Statistics;