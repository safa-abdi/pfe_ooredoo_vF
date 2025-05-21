import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './STTStatisticsComponent.css';

const STTStatisticsComponent = ({ sttData, selectedDate, startDate, endDate }) => {
  const [displayUnit, setDisplayUnit] = useState('hours');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('activation');
  const [chartData, setChartData] = useState([]);
  const [globalStats, setGlobalStats] = useState({
    avg_sla_equipe: null,
    avg_temps_affectation: null
  });

  const getPeriod = useMemo(() => {
    if (selectedDate) {
      return 'day';
    } else if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 7) return 'week';
      if (diffDays <= 30) return 'month';
      return 'custom';
    }
    return 'all';
  }, [selectedDate, startDate, endDate]);

  const allProcessedData = useMemo(() => {
    if (!sttData) return null;

    const result = {
      activation: null,
      plainte: null,
      resiliation: null
    };
    const processData = (type) => {
      if (sttData[type]?.details) {
        return {
          chartData: sttData[type].details.map(team => ({
            name: team.group_by || 'Équipe',
            sla: parseFloat(team.avg_sla_stt) || 0,
            rdv: parseFloat(team.avg_temps_rdv) || 0,
          })),
          globalStats: {
            avg_sla_equipe: sttData[type].avg_sla_equipe,
            avg_temps_affectation: sttData[type].avg_temps_affectation
          }
        };
      }
      return null;
    };

    result.activation = processData('activation');
    result.plainte = processData('plainte');
    result.resiliation = processData('resiliation');

    console.log("All processed data:", result);
    return result;
  }, [sttData]);

  useEffect(() => {
    if (allProcessedData) {
      const currentData = allProcessedData[activeTab];

      if (currentData) {
        console.log(`Setting ${activeTab} data:`, currentData);
        setChartData(currentData.chartData);
        setGlobalStats(currentData.globalStats);
        setIsLoading(false);
      } else {
        console.warn(`No data available for ${activeTab}`);
        setChartData([]);
        setIsLoading(false);
      }
    } else {
      console.warn("No valid data processed");
      setChartData([]);
      setIsLoading(false);
    }
  }, [allProcessedData, activeTab]);

  const convertValue = (value) => {
    if (value === null || value === undefined) return null;
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return displayUnit === 'days' ? numValue / 24 : numValue;
  };

  const formatDisplay = (value) => {
    const converted = convertValue(value);
    return converted !== null ? converted.toFixed(2) : 'N/A';
  };

   const renderPeriodInfo = () => {
    if (selectedDate) {
      return `Données pour le ${new Date(selectedDate).toLocaleDateString('fr-FR')}`;
    } else if (startDate && endDate) {
      return `Données du ${new Date(startDate).toLocaleDateString('fr-FR')} au ${new Date(endDate).toLocaleDateString('fr-FR')}`;
    }
    return 'Toutes les données';
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Chargement des données...</p>
      </div>
    );
  }

  return (
    <div className="stt-container2">
      <motion.div className="header2">
        <h2>Performances Équipes Fixe jdid</h2>
        <div className="period-info">
          <p>{renderPeriodInfo()}</p>
        </div>
        <div className="data-type-tabs">
          <button
            className={activeTab === 'activation' ? 'active' : ''}
            onClick={() => setActiveTab('activation')}
          >
            Activations
          </button>
          <button
            className={activeTab === 'plainte' ? 'active' : ''}
            onClick={() => setActiveTab('plainte')}
          >
            Plaintes
          </button>
          {allProcessedData?.resiliation && (
            <button
              className={activeTab === 'resiliation' ? 'active' : ''}
              onClick={() => setActiveTab('resiliation')}
            >
              Résiliations
            </button>
          )}
        </div>
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

      {!chartData.length ? (
        <div className="no-data-container">
          <p>Aucune donnée disponible pour les {activeTab}</p>
        </div>
      ) : (
        <>
          <motion.div className="global-stats">
            <h3>Moyennes Globales ({activeTab})</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-label">SLA Moyen Équipe</div>
                <div className="stat-value">
                  {formatDisplay(globalStats.avg_sla_equipe)} {displayUnit === 'days' ? 'j' : 'h'}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Temps Moyen d'Affectation</div>
                <div className="stat-value">
                  {formatDisplay(globalStats.avg_temps_affectation)} {displayUnit === 'days' ? 'j' : 'h'}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div className="chart-section">
            <h3>Comparaison des Performances par STT ({activeTab})</h3>
            <div className="line-chart-container">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={70}
                    tickFormatter={(value) => {
                      const maxLength = 5;
                      return value.length > maxLength
                        ? `${value.substring(0, maxLength)}...`
                        : value;
                    }}
                  />
                  <YAxis
                    label={{
                      value: `Temps (${displayUnit === 'days' ? 'jours' : 'heures'})`,
                      angle: -90,
                      position: 'insideLeft'
                    }}
                  />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="sla"
                    name="SLA STT"
                    stroke="#9cbccd"
                    strokeWidth={2}
                    dot={{ r: 6 }}
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rdv"
                    name="Temps RDV"
                    stroke="#3d5567"
                    strokeWidth={2}
                    dot={{ r: 6 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div className="data-table">
            <h3>Détails par Équipe ({activeTab})</h3>
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
                  {chartData.map((team, index) => (
                    <tr key={index}>
                      <td>{team.name}</td>
                      <td>{formatDisplay(team.sla)}</td>
                      <td>{formatDisplay(team.rdv)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
};

export default STTStatisticsComponent;  