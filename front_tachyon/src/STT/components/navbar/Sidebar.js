import React from 'react';
import '../../styles/Sidebar.css';
import { NavLink } from "react-router-dom";

const Sidebar = () => {
    return (
        <div className="sidebar">
                  <nav className={`slidebar-vertical`}>
                    <ul>
                    <li><NavLink to="/STT">Dashboard</NavLink></li>
                    <li><NavLink to="/TaskPage">Taches</NavLink></li>
                    <li><NavLink to="/STT_Stock">Stock</NavLink></li>
                    <li><NavLink to="/tech">Techniciens</NavLink></li>
                        
                    </ul>
                  </nav>
        </div>
    );
};

export default Sidebar;