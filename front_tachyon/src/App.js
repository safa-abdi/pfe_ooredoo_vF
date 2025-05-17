import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./Login/LoginPage";
import ZMDashboard from "./ZM/Dashboard_ZM/pages/ZMDashboard";
import ProtectedRoute from "./routes/ProtectedRoute";
import { useDispatch } from "react-redux";
import { jwtDecode } from "jwt-decode";
import { loginSuccess } from "./redux/authSlice";
import ListSTT from "./ZM/G_STT/component/ListSTT";
//import Gstock from "./ZM/G_stock/components/G_stock";
//import Gstock from  "./ZM/G_stock/pages/G_stock"
import Gstock from "./ZM/G_stock/Gstock";
//import Gstock from "./ZM/G_stock/pages/G_stock";
import Dashboard from "./STT/components/Dashboard/Dashboard";
import Inscription  from "./Inscription/Inscription";
import StockPage from "./STT/components/stock/stock";
import ActivationsPage from "./ZM/Demandes/activation/pages/ActivationsPage";
import TaskPage from "./STT/components/task/task";
import PlaintesPage from "./ZM/Demandes/plainte/pages/PlaintePage";
import ResiliationsPage from "./ZM/Demandes/resiliation/pages/ResiliationPage";

import PlaintesProblemesPage from "./ZM/Demandes/plainte/component/plaintesProblemes/PlaintesProblemesPage";
import TechnicienDashboard from "./Technicien/TechnicienDashboard";
import 'typeface-tajawal';
function App() {
  const dispatch = useDispatch();

  // Vérifier le token au chargement de l'application
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        const user = JSON.parse(localStorage.getItem("user"));

        // Vérifier si le token est expiré
        const currentTime = Date.now() / 1000;
        if (decodedToken.exp < currentTime) {
          console.log("Token expiré");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          return;
        }

        // Restaurer l'état d'authentification
        dispatch(
          loginSuccess({
            token,
            role: decodedToken.role,
            user,
          })
        );
      } catch (error) {
        console.error("Failed to decode token:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
  }, [dispatch]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />

        <Route
          path="/inscription"
          element={
              <Inscription />
          }
        />
        <Route
          path="/ZM-dashboard"
          element={
            <ProtectedRoute requiredRole="membre-equipe">
              <ZMDashboard />
            </ProtectedRoute>
          }
        />
         <Route
          path="/ZM-Plaintes"
          element={
            <ProtectedRoute requiredRole="membre-equipe">
              <PlaintesPage />
            </ProtectedRoute>
          }
        />
         <Route
          path="/ZM-Resiliations"
          element={
            <ProtectedRoute requiredRole="membre-equipe">
              <ResiliationsPage />
            </ProtectedRoute>
          }
        />
        
         <Route
          path="/demandes"
          element={
            <ProtectedRoute requiredRole="membre-equipe">
              <ActivationsPage />
            </ProtectedRoute>
          }
        />
        
         <Route
          path="/Plaintes-problem"
          element={
            <ProtectedRoute requiredRole="membre-equipe">
              <PlaintesProblemesPage/>
            </ProtectedRoute>
          }
        />
        <Route
          path="/G-STT"
          element={
            <ProtectedRoute requiredRole="membre-equipe">
              <ListSTT />
            </ProtectedRoute>
          }
        />
        <Route
          path="/G-STOCK"
          element={
            <ProtectedRoute requiredRole="membre-equipe">
              <Gstock />
            </ProtectedRoute>
          }
        />
 <Route
          path="/STT"
          element={
            <ProtectedRoute requiredRole="sous-traitant">
              <Dashboard />
            </ProtectedRoute>
          }
        />
         <Route
          path="/tech"
          element={
            <ProtectedRoute requiredRole="sous-traitant">
              <TechnicienDashboard />
            </ProtectedRoute>
          }
        />
         <Route
          path="/STT_Stock"
          element={
            <ProtectedRoute requiredRole="sous-traitant">
              <StockPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/TaskPage"
          element={
            <ProtectedRoute requiredRole="sous-traitant">
              <TaskPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<h1>Page non trouvée</h1>} />
      </Routes>
    </Router>
  );
}

export default App;