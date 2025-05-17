import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="home">
      <h1>Bienvenue sur l'application d'activation</h1>
      <Link to="/activations" className="btn">
        Voir les activations
      </Link>
    </div>
  );
};

export default Home;