import React, { useState, useEffect } from 'react';
import './StatusCardsComponent.css';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const GouvDashboardStats = () => {
  const [sttData, setSttData] = useState({ activations: [], plaintes: [] });
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const fetchSttData = async () => {
      try {
        const [activationsRes, plaintesRes] = await Promise.all([
          fetch('http://localhost:3000/activation/in-progress-by-gouvernorat'),
          fetch('http://localhost:3000/plainte/in-progress-by-gouvernorat')
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
      <div className="chart-container">
  <h3>Répartition des demandes en cours par Gouvernorat</h3>
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

export default GouvDashboardStats;
