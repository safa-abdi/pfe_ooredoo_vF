import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './STTStatisticsComponent.css';

const STTStatisticsComponent = ({ sttData, selectedDate, startDate, endDate }) => {
  const [displayUnit, setDisplayUnit] = useState('hours');
  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState([]);

  // Conversion des valeurs
  const convertValue = (value) => {
    if (value === null || value === undefined) return null;
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return displayUnit === 'days' ? numValue / 24 : numValue;
  };

  // Formatage pour l'affichage
  const formatDisplay = (value) => {
    const converted = convertValue(value);
    return converted !== null ? converted.toFixed(2) : 'N/A';
  };

  // Préparation des données
  useEffect(() => {
    if (sttData) {
      setIsLoading(false);
      const preparedData = sttData.details?.map(team => ({
        name: team.group_by || 'Équipe',
        sla: parseFloat(team.avg_sla_stt),
        rdv: parseFloat(team.avg_temps_rdv),
      })) || [];
      setChartData(preparedData);
    }
  }, [sttData, displayUnit]);

  console.log("chart data",chartData)
  // Tooltip personnalisé
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="team-name">{label}</p>
          <div className="metric-row">
            <span className="metric-dot sla-dot"></span>
            <span>SLA: {formatDisplay(payload[0].value)} {displayUnit === 'days' ? 'j' : 'h'}</span>
          </div>
          <div className="metric-row">
            <span className="metric-dot rdv-dot"></span>
            <span>RDV: {formatDisplay(payload[1].value)} {displayUnit === 'days' ? 'j' : 'h'}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  if (isLoading || !sttData) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Chargement des données...</p>
      </div>
    );
  }

  return (
    <div className="stt-container2">
      {/* En-tête */}
      <motion.div 
        className="header2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2>Performances Équipes Fixe jdid</h2>
        <div className="unit-toggle">
          <button 
            onClick={() => setDisplayUnit('hours')}
            className={displayUnit === 'hours' ? 'active' : ''}
          >
            Afficher en heures
          </button>
          <button 
            onClick={() => setDisplayUnit('days')}
            className={displayUnit === 'days' ? 'active' : ''}
          >
            Afficher en jours
          </button>
        </div>
      </motion.div>

      {/* Moyennes globales */}
      <motion.div
        className="global-stats"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <h3>Moyennes Globales</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">SLA Moyen Équipe</div>
            <div className="stat-value">
              {formatDisplay(sttData.avg_sla_equipe)} {displayUnit === 'days' ? 'j' : 'h'}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Temps Moyen d'Affectation</div>
            <div className="stat-value">
              {formatDisplay(sttData.avg_temps_affectation)} {displayUnit === 'days' ? 'j' : 'h'}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Graphique en courbes */}
      <motion.div
        className="chart-section"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <h3>Comparaison des Performances par STT</h3>
        <div className="line-chart-container">
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 30, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end"
                height={70}
                tick={{ fill: '#555' }}
              />
              <YAxis 
                label={{ 
                  value: `Temps (${displayUnit === 'days' ? 'jours' : 'heures'})`, 
                  angle: -90, 
                  position: 'insideLeft',
                  fill: '#555'
                }}
                tick={{ fill: '#555' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="sla"
                name="SLA STT"
                stroke="#2ecc71"
                strokeWidth={3}
                dot={{ r: 6 }}
                activeDot={{ r: 8 }}
                animationDuration={1500}
              />
              <Line
                type="monotone"
                dataKey="rdv"
                name="Temps RDV"
                stroke="#e74c3c"
                strokeWidth={3}
                dot={{ r: 6 }}
                activeDot={{ r: 8 }}
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Tableau de données détaillées */}
      <motion.div
        className="data-table"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <h3>Détails par Équipe</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Équipe</th>
                <th>SLA STT ({displayUnit === 'days' ? 'j' : 'h'})</th>
                <th>Temps RDV ({displayUnit === 'days' ? 'j' : 'h'})</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((team, index) => {
                const sla = convertValue(team.sla);
                const rdv = convertValue(team.rdv);
                
                return (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <td>{team.name}</td>
                    <td>{sla.toFixed(2)}</td>
                    <td>{rdv.toFixed(2)}</td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default STTStatisticsComponent;