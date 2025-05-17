import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['orange', '#0000FF', '#FF0000'];

const StatisticsComponent = ({ 
  chartData2, 
  activationCount, 
  plainteCount, 
  resiliationCount,
  dataType
}) => {
  // Texte descriptif en fonction du type de données affiché
  const getDescription = () => {
    switch(dataType) {
      case 'activation':
        return "Statistiques des activations en cours";
      case 'plainte':
        return "Statistiques des plaintes en cours";
      case 'resiliation':
        return "Statistiques des résiliations en cours";
      default:
        return " ";
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ marginRight: '150px', minWidth: '200px' }}>
          <div style={{ marginBottom: '10px', color: COLORS[0] }}>
            <strong>Activation:</strong> {activationCount}
          </div>
          <div style={{ marginBottom: '10px', color: COLORS[1] }}>
            <strong>Plainte:</strong> {plainteCount}
          </div>
          <div style={{ marginBottom: '10px', color: COLORS[2] }}>
            <strong>Resiliation:</strong> {resiliationCount}
          </div>
          <div style={{ marginTop: '20px', fontStyle: 'italic', color: '#666' }}>
            {getDescription()}
          </div>
        </div>
        <ResponsiveContainer width="50%" height={300}>
          <PieChart>
            <Pie
              data={chartData2}
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              labelLine={false}
              label={({ percent }) => `${(percent * 100).toFixed(2)}%`}
            >
              {chartData2.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StatisticsComponent;