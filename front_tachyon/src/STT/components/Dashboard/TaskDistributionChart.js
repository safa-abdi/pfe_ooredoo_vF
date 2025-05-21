import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import './TaskDistributionChart.css';

const TaskDistributionChart = ({ data }) => {
  const colors = {
    total: '#453f3d',
    terminated: '#9cbccd',
    inProgress: '#3d5567',
    abandoned: '#223030' // corrigé : couleur invalide auparavant (#223030a → erreur)
  };

  const legendPayload = [
    { value: 'Total', type: 'square', color: colors.total, id: 'total' },
    { value: 'Terminées', type: 'square', color: colors.terminated, id: 'terminated' },
    { value: 'En cours', type: 'square', color: colors.inProgress, id: 'inProgress' },
    { value: 'Abandonnées', type: 'square', color: colors.abandoned, id: 'abandoned' },
  ];

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
    <div className="chart-card">
      <p className="chart-subtitle">Répartition des tâches par statut</p>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
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
              value: 'Nombre de demandes',
              angle: -90,
              position: 'insideLeft',
              fontSize: 14
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend payload={legendPayload} wrapperStyle={{ paddingBottom: 20 }} />

          <Bar dataKey="total" name="Total" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-total-${index}`} fill={colors.total} />
            ))}
          </Bar>
          <Bar dataKey="terminated" name="Terminées" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-terminated-${index}`} fill={colors.terminated} />
            ))}
          </Bar>
          <Bar dataKey="inProgress" name="En cours" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-inprogress-${index}`} fill={colors.inProgress} />
            ))}
          </Bar>
          <Bar dataKey="abandoned" name="Abandonnées" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-abandoned-${index}`} fill={colors.abandoned} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="chart-footer">Source : Données internes</div>
    </div>
  );
};

export default TaskDistributionChart;
