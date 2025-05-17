import React from 'react';
import '../../styles/TechnicianList.css';

const TechnicianList = () => {
    return (
        <div className="technician-list">
            <h1>Liste des Techniciens</h1>
            <table>
                <thead>
                    <tr>
                        <th>Nom</th>
                        <th>Spécialité</th>
                        <th>Statut</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Jean Dupont</td>
                        <td>Électricien</td>
                        <td>Disponible</td>
                        <td>
                            <button>Assigner</button>
                        </td>
                    </tr>
                    {/* Ajouter plus de lignes ici */}
                </tbody>
            </table>
        </div>
    );
};

export default TechnicianList;