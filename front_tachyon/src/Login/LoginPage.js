import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./LoginPage.css";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../redux/authSlice";
import { jwtDecode } from "jwt-decode";

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Veuillez remplir tous les champs");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:3000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, mdp: password }),
      });

      const data = await response.json();
      console.log("API Response:", data);

      setLoading(false);

      if (!response.ok) {
        if (response.status === 401) {
          setError("Email ou mot de passe incorrect");
        } else {
          setError(data.message || "Échec de la connexion");
        }
      } else {
        const decodedToken = jwtDecode(data.access_token);
        console.log("Decoded Token:", decodedToken);

        localStorage.setItem("token", data.access_token);
        localStorage.setItem(
          "user",
          JSON.stringify({ email: decodedToken.email, role: decodedToken.role })
        );

        dispatch(
          loginSuccess({
            token: data.access_token,
            role: decodedToken.role,
            user: { email: decodedToken.email, role: decodedToken.role },
          })
        );

        if (decodedToken.role === "admin") {
          navigate("/admin-dashboard");
        } else if (decodedToken.role === "membre-equipe") {
          navigate("/ZM-dashboard");
        } else if (decodedToken.role === "sous-traitant") {
          navigate("/STT");
        } else {
          navigate("/");
        }
      }
    } catch (error) {
      setLoading(false);
      setError("Une erreur est survenue. Veuillez réessayer.");
      console.error("Erreur d'authentification:", error);
    }
  };

  return (
    <div className="back_container">
      <div className="main-container">
        <div className="logo-container">
          <img src="/images/logo_ooredoo.png" alt="Logo" className="logo" />
        </div>

        <h1 className="tachyon-title">
          <span className="red_title">T</span>
          <span className="red_title">A</span>
          <span className="red_title">C</span>
          <span className="red_title">H</span>
          <span className="red_title">Y</span>
          <span className="red_title">O</span>
          <span className="red_title">N</span>
        </h1>

        <div className="login-section">
          <h1>Connexion</h1>
          <div className="login-box">
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleLogin}>
              <div className="mb-3 text-start">
                <label htmlFor="email" className="form-label">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3 text-start">
                <label htmlFor="password" className="form-label">
                  Mot de passe
                </label>
                <input
                  type="password"
                  id="password"
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="forgot-password">
                <a href="/reset-password" className="forgot-link">
                  Mot de passe oublié ?
                </a>
              </div>

              <button type="submit" className="BValid" disabled={loading}>
                {loading ? "Chargement..." : "Se connecter"}
              </button>
            </form>
          </div>
        </div>

        <div className="vertical-line"></div>

        <div className="animation-section">
          <div className="logo-circle">
            {["o", "o", "r", "e", "d", "o", "o"].map((letter, index) => (
              <div key={index} className="circle-letter">
                {letter.toUpperCase()}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;