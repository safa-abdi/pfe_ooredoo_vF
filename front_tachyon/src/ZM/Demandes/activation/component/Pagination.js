import React from 'react';

const Pagination = ({ page, total, limit, onPageChange }) => {
  return (
    <div className="pagination">
      <button onClick={() => onPageChange(page - 1)} disabled={page === 1}>
        Précédent
      </button>
      <span>Page {page}</span>
      <button onClick={() => onPageChange(page + 1)} disabled={page * limit >= total}>
        Suivant
      </button>
    </div>
  );
};

export default Pagination;