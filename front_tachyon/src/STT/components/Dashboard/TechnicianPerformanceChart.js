import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './TechnicianPerformanceChart.css';

const TechnicianPerformanceChart = ({ data }) => {
    const minWidth = Math.max(data.length * 80, 800);

    return (
        <div className="technician-chart-container">
            <div className="chart-scroll-container" style={{ minWidth: `${minWidth}px` }}>
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart
                        data={data}
                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                        barGap={5}
                        barCategoryGap={15}
                    >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis 
                            dataKey="name" 
                            angle={-45} 
                            textAnchor="end" 
                            height={70}
                            tick={{ fontSize: 12 }}
                            interval={0}
                        />
                        <YAxis 
                            label={{ 
                                value: 'Temps moyen (min)', 
                                angle: -90, 
                                position: 'insideLeft',
                                fontSize: 12
                            }}
                        />
                        <Tooltip 
                            contentStyle={{
                                backgroundColor: '#fff',
                                borderRadius: '6px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                border: 'none'
                            }}
                        />
                        <Legend 
                            verticalAlign="top" 
                            height={40}
                            wrapperStyle={{ paddingBottom: 10 }}
                        />
                        <Bar dataKey="activation" name="Activation" fill="#9cbccd" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="complaint" name="Plainte" fill="#3d5567" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="termination" name="Résiliation" fill="#223030a" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default TechnicianPerformanceChart;