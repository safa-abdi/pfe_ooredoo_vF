import React from 'react';
import { FaTrash, FaEdit,FaPhone } from 'react-icons/fa';

const SubcontractorCard = ({ sub, onDelete, onViewBranches, onEdit }) => {
    const handleEdit = () => {
        onEdit(sub); 
    };

    return (
        <div className="subcontractor-card">
    <p
        className="STT_name"
        onClick={() => onViewBranches(sub.id)}
        style={{ 
            cursor: 'pointer', 
            color: '#1a73e8', 
            fontWeight: '600',
            fontSize: '1.1rem',
            marginBottom: '0.75rem'
        }}
    >
        {sub.name}
    </p>
    
    <div className="contact-info" style={{ marginBottom: '0.5rem' }}>
        <p style={{ margin: '0.25rem 0', display: 'flex', alignItems: 'flex-start' }}>
            <strong style={{ minWidth: '70px', display: 'inline-block', color: '#5f6368' }}>Adresse :</strong>
            <span style={{ wordBreak: 'break-word' }}>{sub.adresse || 'Non renseignée'}</span>
        </p>
        <p style={{ margin: '0.25rem 0', display: 'flex', alignItems: 'center' }}>
            <strong style={{ minWidth: '70px', display: 'inline-block', color: '#5f6368' }}>Contact :</strong>
            {sub.contact ? (
                <a 
                    href={`tel:${sub.contact}`} 
                    style={{ 
                        color: '#1a73e8', 
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                    }}
                >
                    <FaPhone style={{ fontSize: '0.8rem' }} />
                    {sub.contact}
                </a>
            ) : (
                <span>Non renseigné</span>
            )}
        </p>
    </div>

    <div className="card-actions" style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        marginTop: '1rem',
        borderTop: '1px solid #f1f1f1',
        paddingTop: '0.75rem'
    }}>
        <button 
            onClick={() => onDelete(sub.id)} 
            className="delete-btn"

        >
            <FaTrash />
            <span>Supprimer</span>
        </button>
        <button 
            onClick={handleEdit} 
            className="edit-btn"
           
        >
            <FaEdit />
            <span>Modifier</span>
        </button>
    </div>
</div>
    );
};


export default SubcontractorCard;