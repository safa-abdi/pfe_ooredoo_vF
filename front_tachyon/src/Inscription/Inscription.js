import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Inscription.css";
import { useNavigate } from "react-router-dom";

const Inscription = () => {
  const navigate = useNavigate(); // Initialisation de navigate

  const [email, setEmail] = useState("");
  const [Nom, setNom] = useState("");
  const [Prenom, setPrenom] = useState("");
  const [Telephone, setTelephone] = useState("");
  const [password, setPassword] = useState("");
  const [validpassword, setvalidpassword] = useState("");
  const [dateNaissance, setdateNaissance] = useState("");
  const [role_id, setRoleId] = useState(2); // Rôle par défaut : Utilisateur
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState(""); // Code de validation
  const [isVerificationStep, setIsVerificationStep] = useState(false); // Pour basculer à l'étape de vérification

  const validatePassword = (password) => {
    const errors = [];

    if (password.length < 8) {
      errors.push("Le mot de passe doit contenir au moins 8 caractères.");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Le mot de passe doit contenir au moins une lettre majuscule.");
    }
    if (!/[a-z]/.test(password)) {
      errors.push("Le mot de passe doit contenir au moins une lettre minuscule.");
    }
    if (!/[0-9]/.test(password)) {
      errors.push("Le mot de passe doit contenir au moins un chiffre.");
    }
    if (!/[!@#$%^&*]/.test(password)) {
      errors.push("Le mot de passe doit contenir au moins un caractère spécial.");
    }

    return errors;
  };

  const validateDateNaissance = (dateNaissance) => {
    const dateActuelle = new Date();
    const dateNaissanceObj = new Date(dateNaissance);
    const dateMinimum = new Date(
      dateActuelle.getFullYear() - 18,
      dateActuelle.getMonth(),
      dateActuelle.getDate()
    );

    if (dateNaissanceObj > dateActuelle || dateNaissanceObj > dateMinimum) {
      return "Veuillez indiquer une date de naissance valide.";
    }

    return null;
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordErrors(validatePassword(newPassword));
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!verificationCode) {
      setError("Veuillez entrer le code de validation");
      return;
    }
    setError("");
    setLoading(true);

    try {
      // Envoyer une requête pour vérifier le code
      const response = await fetch(
        `http://localhost:3000/users/verify?email=${email}&code=${verificationCode}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            mdp: password,
            nom: Nom,
            prénom: Prenom,
            num_tel: Telephone,
            date_naiss: dateNaissance,
            role_id,
            disponibilité: true,

          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Code de validation incorrect");
      }

      const data = await response.json();
      console.log("Utilisateur créé avec succès :", data);
      setIsVerificationStep(false); // Revenir à l'étape de connexion
      // eslint-disable-next-line no-undef
      navigate("/"); 

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInscription = async (e) => {
    e.preventDefault();
  
    const dateNaissanceError = validateDateNaissance(dateNaissance);
    if (dateNaissanceError) {
      setError(dateNaissanceError);
      return;
    }
  
    if (!email || !password || !Nom || !Prenom || !Telephone || !validpassword || !dateNaissance) {
      setError("Veuillez remplir tous les champs");
      return;
    }
  
    const passwordValidationErrors = validatePassword(password);
    if (passwordValidationErrors.length > 0) {
      setPasswordErrors(passwordValidationErrors);
      return;
    }
  
    if (password !== validpassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
  
    setError("");
    setLoading(true);
  
    try {
      // Formater la date de naissance au format YYYY-MM-DD
      const formattedDateNaissance = new Date(dateNaissance).toISOString().split("T")[0];
  
      // Envoyer une requête pour créer un utilisateur
      const response = await fetch("http://localhost:3000/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          mdp: password,
          nom: Nom,
          prénom: Prenom, // Utiliser le nom de champ exact attendu par l'API
          num_tel: Telephone, // Utiliser le nom de champ exact attendu par l'API
          date_naiss: formattedDateNaissance,
          role_id,
          disponibilité: true,
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Échec de la création de l'utilisateur");
      }
  
      const data = await response.json();
      console.log("Code de validation envoyé :", data);
      setIsVerificationStep(true); // Passer à l'étape de vérification
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="back_container">
      <div className="maininsc-container">
        <div className="logo-container">
          <img src="/images/logo_ooredoo.png" alt="Logo" className="logo" />
        </div>

        <h1 className="tachyon-title">
          <span className="white-text">T</span>
          <span className="white-text">A</span>
          <span className="white-text">C</span>
          <span className="white-text">H</span>
          <span className="white-text">Y</span>
          <span className="white-text">O</span>
          <span className="white-text">N</span>
        </h1>

        <div className="inscription-section">
          <h1>Inscription</h1>
          <div className="inscription-box">
            {error && <div className="alert alert-danger">{error}</div>}
            {isVerificationStep ? (
              // Étape de vérification du code
              <form onSubmit={handleVerify}>
                <div className="mb-3 text-start">
                  <label htmlFor="code" className="form-label">
                    Code de validation
                  </label>
                  <input
                    type="text"
                    id="code"
                    className="form-control"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="BTN_Inscrire" disabled={loading}>
                  {loading ? "Chargement..." : "Vérifier"}
                </button>
              </form>
            ) : (
              // Étape d'inscription
              <form onSubmit={handleInscription}>
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3 text-start">
                      <label htmlFor="Nom" className="form-label">Nom</label>
                      <input
                        onKeyPress={(event) => {
                          if (!/[A-Za-z]/.test(event.key)) {
                            event.preventDefault();
                          }
                        }}
                        type="text"
                        id="Nom"
                        className="form-control"
                        value={Nom}
                        onChange={(e) => setNom(e.target.value)}
                        maxLength="8"
                        required
                      />
                    </div>
                    <div className="mb-3 text-start">
                      <label htmlFor="Prenom" className="form-label">Prénom</label>
                      <input
                        onKeyPress={(event) => {
                          if (!/[A-Za-z]/.test(event.key)) {
                            event.preventDefault();
                          }
                        }}
                        type="text"
                        id="Prenom"
                        className="form-control"
                        value={Prenom}
                        onChange={(e) => setPrenom(e.target.value)}
                        required
                      />
                    </div>
                    <div className="mb-3 text-start">
                      <label htmlFor="email" className="form-label">Email</label>
                      <input
                        type="email"
                        id="email"
                        className="form-control"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3 text-start">
                      <label htmlFor="Telephone" className="form-label">Téléphone</label>
                      <input
                        onKeyPress={(event) => {
                          if (!/[0-9]/.test(event.key)) {
                            event.preventDefault();
                          }
                        }}
                        type="text"
                        id="Telephone"
                        className="form-control"
                        value={Telephone}
                        maxLength="8"
                        minLength="8"
                        onChange={(e) => setTelephone(e.target.value)}
                        required
                      />
                    </div>
                    <div className="mb-3 text-start">
                      <label htmlFor="dateNaissance" className="form-label">Date de naissance</label>
                      <input
                        type="date"
                        id="dateNaissance"
                        className="form-control"
                        value={dateNaissance}
                        onChange={(e) => setdateNaissance(e.target.value)}
                        required
                      />
                      {error && <div className="text-danger">{error}</div>}
                    </div>
                    <div className="mb-3 text-start">
                      <label htmlFor="password" className="form-label">Mot de passe</label>
                      <input
                        type="password"
                        id="password"
                        className="form-control"
                        value={password}
                        onChange={handlePasswordChange}
                        required
                      />
                      {passwordErrors.length > 0 && (
                        <div className="text-danger">
                          {passwordErrors.map((error, index) => (
                            <div key={index}>{error}</div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="mb-3 text-start">
                      <label htmlFor="validpassword" className="form-label">Confirmer Mot de passe</label>
                      <input
                        type="password"
                        id="validpassword"
                        className="form-control"
                        value={validpassword}
                        onChange={(e) => setvalidpassword(e.target.value)}
                        required
                      />
                      {password !== validpassword && validpassword && (
                        <div className="text-danger">Les mots de passe ne correspondent pas.</div>
                      )}
                    </div>
                    <div className="mb-3 text-start">
                      <label htmlFor="role_id" className="form-label">Rôle</label>
                      <select
                        id="role_id"
                        className="form-control"
                        value={role_id}
                        onChange={(e) => setRoleId(Number(e.target.value))}
                        required
                      >
                        <option value={1}>Admin</option>
                        <option value={2}>Utilisateur</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <button type="submit" className="BTN_Inscrire" disabled={loading}>
                    {loading ? "Chargement..." : "Valider"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        <div className="verticalinsc-line"></div> {/* Ligne verticale */}

        <div className="animation-section">
          <div className="logo-circle">
            {["o", "o", "r", "e", "d", "o", "o"].map((letter, index) => (
              <div key={index} className="circle-letter">{letter.toUpperCase()}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inscription;