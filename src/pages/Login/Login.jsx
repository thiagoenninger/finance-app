import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

import "./style.css";
import { Mail, Lock, AlertCircle, Loader } from "lucide-react";
import AppIcon from "../../assets/icons/app-icon.svg";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      const messages = {
        "auth/invalid-credential": "Email ou senha incorretos.",
        "auth/user-not-found": "Usuário não encontrado.",
        "auth/wrong-password": "Senha incorreta.",
        "auth/too-many-requests":
          "Muitas tentativas, tente novamente mais tarde",
        "auth/user-disabled": "Este usuário foi desativado.",
      };
      setError(
        messages[err.code] ||
          "Erro ao fazer login. Tente novamente mais tarde.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-left-content">
          <div className="login-left-image">
            <img className="login-left-image-icon" src={AppIcon} alt="logo" />
          </div>
          <h1 className="login-left-title">GestPro</h1>
          <p className="login-left-description">
            Sistema de Gestão Financeira para Projetos Culturais
          </p>
        </div>
      </div>

      <div className="login-right">
        <div className="login-right-content">
          <h2 className="login-right-title">Bem-vindo ao GestPro</h2>
          <p className="login-right-text">Faça login para acessar o sistema</p>

          {error && (
            <div className="login-error">
              <AlertCircle size={16} aria-hidden />
              <span>{error}</span>
            </div>
          )}
          <form onSubmit={handleSubmit} noValidate>
            <div className="login-right-field">
              <label htmlFor="email" className="login-right-label">
                Email
              </label>
              <div className="login-right-input-wrap">
                <Mail
                  className="login-right-input-icon"
                  size={18}
                  aria-hidden
                />
                <input
                  id="email"
                  className="login-right-input login-right-input--with-icon"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="login-right-field">
              <label htmlFor="senha" className="login-right-label">
                Senha
              </label>
              <div className="login-right-input-wrap">
                <Lock
                  className="login-right-input-icon"
                  size={18}
                  aria-hidden
                />
                <input
                  id="senha"
                  className="login-right-input login-right-input--with-icon"
                  type="password"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              className="login-right-button"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <Loader size={18} className="login-spinner aria-hidden" />
              ) : (
                "Entrar"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
