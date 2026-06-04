import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Card, Btn, Field } from "../components/ui";

export default function Login() {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(() => {
    const saved = localStorage.getItem("gmao_remember_email");
    if (saved) {
      setEmail(saved);
      return true;
    }
    return false;
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const from = location.state?.from?.pathname || "/";

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!email.trim()) {
      setError("Veuillez entrer votre adresse email.");
      return;
    }
    if (!validateEmail(email)) {
      setError("Veuillez entrer une adresse email valide.");
      return;
    }
    if (!password) {
      setError("Veuillez entrer votre mot de passe.");
      return;
    }
    if (password.length < 4) {
      setError("Le mot de passe doit contenir au moins 4 caracteres.");
      return;
    }

    setLoading(true);

    try {
      // Save email if remember me is checked
      if (rememberMe) {
        localStorage.setItem("gmao_remember_email", email);
      } else {
        localStorage.removeItem("gmao_remember_email");
      }

      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Email ou mot de passe incorrect.");
      } else if (err.response?.status === 404) {
        setError("Aucun compte trouve avec cet email.");
      } else if (err.code === "ERR_NETWORK") {
        setError("Impossible de se connecter au serveur. Verifiez que le backend est lance.");
      } else {
        setError("Une erreur est survenue. Veuillez reessayer.");
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-bg">
      {/* Background gradient */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          background: theme === "dark" 
            ? "radial-gradient(1200px 600px at 70% -10%, rgba(45,212,191,.08), transparent)"
            : "radial-gradient(1200px 600px at 70% -10%, rgba(13,148,136,.06), transparent)"
        }}
      />

      {/* Theme toggle - top right */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 p-3 rounded-xl bg-panel border border-line text-inksoft hover:text-ink hover:bg-panel2 transition-colors"
        aria-label={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
      >
        {theme === "dark" ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
          </svg>
        )}
      </button>

      <div className="w-full max-w-md relative fadeup">
        {/* Logo and title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-5 bg-gradient-to-br from-teal to-tealdeep flex items-center justify-center shadow-lg" style={{ boxShadow: "0 10px 30px rgba(45,212,191,.25)" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#06231f" strokeWidth="2.2" strokeLinecap="round">
              <path d="M14 6l-3 3M8 8l-2 2 4 4M12 12l4 4 2-2" />
              <circle cx="6" cy="18" r="2" />
              <circle cx="18" cy="6" r="2" />
            </svg>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-ink">GMAO</h1>
          <p className="text-inksoft text-sm sm:text-base mt-2">Gestion de Maintenance - Clinique HUPSA</p>
        </div>

        {/* Login form */}
        <Card className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="text-center mb-6">
              <h2 className="text-lg font-semibold text-ink">Connexion</h2>
              <p className="text-sm text-inksoft mt-1">Entrez vos identifiants pour acceder a votre compte</p>
            </div>

            {/* Error message */}
            {error && (
              <div className="p-3 rounded-lg bg-red/10 border border-red/30 text-red text-sm">
                {error}
              </div>
            )}

            {/* Email field */}
            <Field label="Adresse email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre.email@clinique-hupsa.fr"
                autoComplete="email"
                disabled={loading}
                className="w-full"
              />
            </Field>

            {/* Password field */}
            <Field label="Mot de passe">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Entrez votre mot de passe"
                  autoComplete="current-password"
                  disabled={loading}
                  className="w-full pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-inkfaint hover:text-inksoft transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </Field>

            {/* Remember me */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-line bg-panel2 text-teal focus:ring-teal focus:ring-offset-0"
              />
              <span className="text-sm text-inksoft">Se souvenir de mon email</span>
            </label>

            {/* Submit button */}
            <Btn
              type="submit"
              disabled={loading}
              style={{ width: "100%", marginTop: 8 }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Connexion en cours...
                </span>
              ) : (
                "Se connecter"
              )}
            </Btn>
          </form>
        </Card>

        {/* Help text */}
        <p className="text-center mt-6 text-xs sm:text-sm text-inkfaint">
          {"Probleme de connexion ? Contactez l'administrateur systeme."}
        </p>
      </div>
    </div>
  );
}
