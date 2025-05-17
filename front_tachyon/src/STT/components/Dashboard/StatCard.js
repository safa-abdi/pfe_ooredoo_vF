import React from 'react';
import '../styles/StatCard.css';

const StatCard = ({ title, value, color }) => {
    return (
        <div className="stat-card" style={{ borderBottom: `4px solid ${color}` }}>
            <h2>{title}</h2>
            <p>{value}</p>
        </div>
    );
};

export default StatCard;