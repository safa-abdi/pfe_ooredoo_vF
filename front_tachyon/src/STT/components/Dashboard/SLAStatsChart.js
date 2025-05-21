import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import './SLAStatsChart.css';

const colors = {
  avg_sla: '#9cbccd',        
  avg_temps_rdv: '#3d5567',  
};

const SLAStatsChart = ({ data }) => {
  return (
    <div className="chart-container bar-chart">
      <h2>Évolution du SLA et Temps Moyen de RDV</h2>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          barCategoryGap="30%"
          barGap={8}
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
              value: 'Valeurs (%) / Heures',
              angle: -90,
              position: 'insideLeft',
              fontSize: 14,
              dy: 40,
            }}
          />
          <Tooltip animationDuration={400} />
          <Legend verticalAlign="top" height={50} />
          
          <Bar
            dataKey="avg_sla"
            name="SLA Moyen (%)"
            radius={[8, 8, 0, 0]}
            maxBarSize={40}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-sla-${index}`} fill={colors.avg_sla} />
            ))}
          </Bar>

          <Bar
            dataKey="avg_temps_rdv"
            name="Temps Moyen RDV (h)"
            radius={[8, 8, 0, 0]}
            maxBarSize={40}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-rdv-${index}`} fill={colors.avg_temps_rdv} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SLAStatsChart;
