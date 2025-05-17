import React from "react";
import "../../styles/Navbar.css";
import useUserData from "../hooks/useUserData";

const Navbar = () => {
  // eslint-disable-next-line no-unused-vars
  const { user, loading, error } = useUserData();

 

  return (
    
    <nav className="navbar">
      
      <img  className="backImg" src="/images/Ooredoo_logo_2017.png"
       alt="Ooredoo TN" color='black'/>
      <div className="navbar-brand">{user ? `${user.company.name}` : "Chargement..."}</div>
      <div className="navbar-user">
        {user ? `Bienvenue, ${user.nom} ${user.prénom}` : "Chargement..."}
      </div>
      
    </nav>
  );
};

export default Navbar;