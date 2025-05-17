import React from 'react';
import SearchBar from './SearchBar';
import SubcontractorCard from './SubcontractorCard';
import { FaPlus, FaPlusCircle } from 'react-icons/fa';

const ManagementSection = ({ searchTerm, onSearchChange, onAddCompany, filteredSubcontractors, onDelete, onViewBranches, onEdit })  => {
    return (
        <>
            <div className="search-and-add-container">
                <SearchBar
                    searchTerm={searchTerm}
                    onSearchChange={onSearchChange}
                />
                <button className="add-company-btn" onClick={onAddCompany}>
                    <FaPlusCircle /> Ajouter STT
                </button>
            </div>
            <div className="subcontractor-grid">
            {filteredSubcontractors.map(sub => (
                <SubcontractorCard
                    key={sub.id}
                    sub={sub}
                    onDelete={onDelete}
                    onViewBranches={onViewBranches}
                    onEdit={onEdit}
                />
            ))}
            </div>
        </>
    );
};

export default ManagementSection;