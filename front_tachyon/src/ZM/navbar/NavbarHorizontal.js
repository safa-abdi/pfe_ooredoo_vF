import React, { useState, useEffect } from 'react';
import { FaUser } from 'react-icons/fa';
import './Navbar.css';
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../../redux/authSlice"
import axios from "axios";

const NavbarHorizontal = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No token found");
        }

        const response = await axios.get("http://localhost:3000/users/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUser(response.data);
        localStorage.setItem("user", JSON.stringify(response.data));

      } catch (error) {
        console.error("Error fetching user data:", error);
        localStorage.removeItem("token"); 
        navigate("/");
      }
    };

    fetchUserData();
  }, [navigate]);
  const [, setUserImage] = useState(null);
  const dispatch = useDispatch();

  useEffect(() => {
    setUserImage('http://example.com/path/to/user/image.jpg'); 
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    dispatch(logout());

    navigate("/");
  };

  return (
    <nav className="navbar-horizontal">
      <div className="navbar-brand">
      <img  src="/images/logo_ooredoo.png"
       alt="Ooredoo TN" width={170} height={44} color='white'/>
       </div>
      <ul className="navbar-links">
      <div className="header-info">

        <li>
          <a href="/profile">
            <FaUser />
          </a>
        </li>
  <li>{user ? `Bienvenue, ${user.nom} ${user.prénom}` : "Chargement..."}</li>
  <li>
    <button className='btnLogoutNavbar' onClick={handleLogout}>
      Logout
    </button>
  </li>
</div>

      </ul>
    </nav>
  );
};

export default NavbarHorizontal;