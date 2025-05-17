import React, { useState, useEffect } from 'react';
import './StatusCardsComponent.css';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const StatusCardsComponent = ({ data, dataType, onStatusClick, gouvernorat}) => {
  const [sttData, setSttData] = useState({ activations: [], plaintes: [] });
  const [loading, setLoading] = useState(true);

  const handleStatusClick = (statusType) => {
    if (onStatusClick) {
      onStatusClick(statusType, dataType);
    }
  };


  const statusLabels = {
    frozen: 'Gelé',
    non_affected: 'Non affecté',
    En_rdv: 'En RDV',
    En_travaux: 'En Travaux'
  };

  const statusTypes = [
    { id: 'non_affected', label: 'Non Affectées', color: '#36A2EB' },
    { id: 'En_rdv', label: 'En RDV', color: '#FFCE56' },
    { id: 'En_travaux', label: 'En Travaux', color: '#4BC0C0' },
    { id: 'frozen', label: 'Gelées', color: '#FF6384' }
  ];

  useEffect(() => {
    const fetchSttData = async () => {
      try {
        const [activationsRes, plaintesRes] = await Promise.all([
          fetch('http://localhost:3000/activation/in-progress-by-company'),
          fetch('http://localhost:3000/plainte/in-progress-by-company')
        ]);

        const activationsData = await activationsRes.json();
        const plaintesData = await plaintesRes.json();

        const transformData = (rawData) => {
          return Object.entries(rawData).map(([stt, { count }]) => ({
            name: stt,
            count
          }));
        };

        setSttData({
          activations: transformData(activationsData),
          plaintes: transformData(plaintesData)
        });
      } catch (error) {
        console.error('Error fetching STT data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSttData();
  }, []);

  const prepareChartData = () => {
    if (loading) return [];

    const allStts = new Set([
      ...sttData.activations.map(item => item.name),
      ...sttData.plaintes.map(item => item.name)
    ]);

    return Array.from(allStts).map(stt => {
      const activationItem = sttData.activations.find(item => item.name === stt);
      const plainteItem = sttData.plaintes.find(item => item.name === stt);

      return {
        name: stt,
        activations: activationItem ? activationItem.count : 0,
        plaintes: plainteItem ? plainteItem.count : 0
      };
    }).sort((a, b) => (b.activations + b.plaintes) - (a.activations + a.plaintes));
  };

  const chartData = prepareChartData();

  return (
    <div className="dashboard2-container">
            {gouvernorat && (
        <div className="gouvernorat-filter-indicator">
          <span>Données filtrées pour: {gouvernorat}</span>
          <button 
            onClick={() => onStatusClick(null, 'reset')} 
            className="clear-filter-btn"
          >
            ×
          </button>
        </div>
      )}

        <div className="status-cards-container">
      {Object.entries(data[dataType] || {}).map(([key, count]) => (
        <div 
          key={key} 
          className="status-card"
          onClick={() => onStatusClick(key)}
        >
          <h4>{statusLabels[key] || key}</h4>
          <p>{count}</p>
        </div>
      ))}
    </div>
      <div className="status-cards-row">
        {statusTypes.map(status => {
          const plainteValue = data?.plaintes?.[status.id] || 0;
          const activationValue = data?.activations?.[status.id] || 0;
          const total = dataType === 'both'
            ? plainteValue + activationValue
            : dataType === 'plainte'
              ? plainteValue
              : activationValue;

          return (
            <div
              key={status.id}
              className="status-card"
              style={{ borderLeft: `4px solid ${status.color}`, cursor: 'pointer' }}
              onClick={() => handleStatusClick(status.id)}
            >
              <div className="status-card-header">
                <h3>{status.label}</h3>
              </div>
              <div className="status-value">{total}</div>
            </div>
          );
        })}
      </div>

      <div className="chart-container">
  <h3>Répartition des demandes en cours par STT</h3>
  <div className="chart-wrapper">
    {loading ? (
      <p>Chargement des données...</p>
    ) : chartData.length > 0 ? (
      <div className="scrollable-chart">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="activations"
              stroke="#36A2EB"
              name="Activations"
              activeDot={{ r: 8 }}
            />
            <Line
              type="monotone"
              dataKey="plaintes"
              stroke="#FF6384"
              name="Plaintes"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    ) : (
      <p>Aucune donnée disponible</p>
    )}
  </div>
</div>

    </div>
  );
};

export default StatusCardsComponent;
