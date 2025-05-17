import React from 'react';

const StatusBadge = ({ status }) => {
    return (
        <span className={`status-badge ${status?.replace(/\s+/g, '-').toLowerCase()}`}>
            {status}
        </span>
    );
};

export default StatusBadge;