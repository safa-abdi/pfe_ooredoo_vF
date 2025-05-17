import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMap } from '@fortawesome/free-solid-svg-icons';
import StatusBadge from './StatusBadge';
import MapLink from './MapLink';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

const PlainteTable = ({ 
    problemPlaintes, 
    loading, 
    hasMore, 
    isInitialLoad, 
    searchTerm, 
    handlePlainteClick,
    sentinelRef,
    handleLoadMore
}) => {
    return (
        <div className="table-responsive">
            <table className="plaintes-table">
                <thead>
                    <tr>
                        <th>CRM Case</th>
                        <th>Date Création</th>
                        <th>Localisation</th>
                        <th>Gouvernorat</th>
                        <th>Délégation</th>
                        <th>Problème</th>
                        <th>Statut</th>
                    </tr>
                </thead>
                <tbody>
                    {problemPlaintes.length > 0 ? (
                        problemPlaintes.map((plainte, index) => (
                            <tr
                                key={`${plainte.crm_case}-${index}`}
                                className={`status-${plainte.STATUT?.replace(/\s+/g, '-').toLowerCase()}`}
                                onClick={() => handlePlainteClick(plainte)}
                                style={{ cursor: 'pointer' }}
                            >
                                <td className="crm-case">{plainte.crm_case}</td>
                                <td>{new Date(plainte.DATE_CREATION_CRM).toLocaleDateString('fr-FR')}</td>
                                <td className="location">
                                    <MapLink 
                                        latitude={plainte.LATITUDE_SITE} 
                                        longitude={plainte.LONGITUDE_SITE} 
                                    />
                                </td>
                                <td>{plainte.Gouvernorat}</td>
                                <td>{plainte.Delegation}</td>
                                <td className="problem-detail">{plainte.Detail}</td>
                                <td>
                                    <StatusBadge status={plainte.STATUT} />
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="7" className="no-data">
                                {searchTerm
                                    ? "Aucune plainte trouvée avec ces critères de recherche"
                                    : "Aucune donnée disponible"}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            <div ref={sentinelRef} className="sentinel"></div>

            {loading && !isInitialLoad && (
                <div className="loading-more">
                    <FontAwesomeIcon icon={faSpinner} spin /> Chargement...
                </div>
            )}

            {!loading && !hasMore && problemPlaintes.length > 0 && (
                <div className="end-of-results">
                    Fin des résultats
                </div>
            )}

            {hasMore && !loading && (
                <button
                    onClick={handleLoadMore}
                    className="load-more-btn"
                >
                    Charger plus de résultats
                </button>
            )}
        </div>
    );
};

export default PlainteTable;