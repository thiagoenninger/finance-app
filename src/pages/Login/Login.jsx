import { useState } from "react";
import { useLocation, Navigate } from "react-router-dom";
import "./style.css";
import { Mail, Lock, AlertCircle, LoaderCircle, Eye, EyeOff, X } from "lucide-react";
import AppIcon from "../../assets/icons/app-icon.svg";
import { useAuth } from "../../context/useAuth";
import { getAuthErrorMessage } from "../../context/authErrors";
import { sendResetPasswordEmail } from "../../services/authServices";
import { CATEGORIA_SIMPLES } from "../../constants/userCategories";
 
export default function Login() {
  const { login, user, categoria, loading } = useAuth();
  const location = useLocation();
 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [resetModalOpen, setResetModalOpen] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [resetStatus, setResetStatus] = useState("idle")
  const [resetError, setResetError] = useState("")
 
  const defaultPath = categoria === CATEGORIA_SIMPLES ? '/consulta-simples' : '/projetos'
  const from = location.state?.from?.pathname || defaultPath
 
  if (user && !loading) {
    return <Navigate to={from} replace />
  }
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(getAuthErrorMessage(err.code, "Erro ao fazer login. Tente novamente."));
      setSubmitting(false);
    }
  };

  const openResetModal = () => {
    setResetEmail(email)
    setResetStatus("idle")
    setResetError("")
    setResetModalOpen(true)
  }

  const closeResetModal = () => {
    setResetModalOpen(false)
  }

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setResetStatus("sending");
    setResetError("");
    try {
      await sendResetPasswordEmail(resetEmail);
      setResetStatus("sent");
    } catch (err) {
      setResetError(
        getAuthErrorMessage(err.code, "Erro ao enviar e-mail. Tente novamente.")
      );
      setResetStatus("error");
    }
  };
 
  return (
     <>
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
                <label htmlFor="email" className="login-right-label">Email</label>
                <div className="login-right-input-wrap">
                  <Mail className="login-right-input-icon" size={18} aria-hidden />
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
                <label htmlFor="senha" className="login-right-label">Senha</label>
                <div className="login-right-input-wrap">
                  <Lock className="login-right-input-icon" size={18} aria-hidden />
                  <input
                    id="senha"
                    className="login-right-input login-right-input--with-icon login-right-input--with-icon-right"
                    type={showPassword ? "text" : "password"}
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="login-password-toggle"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword
                      ? <EyeOff size={18} aria-hidden />
                      : <Eye size={18} aria-hidden />
                    }
                  </button>
                </div>
              </div>
 
              <button
                className="login-right-button"
                type="submit"
                disabled={submitting}
              >
                {submitting
                  ? <LoaderCircle size={18} className="login-spinner" aria-hidden />
                  : "Entrar"
                }
              </button>
 
              <div className="login-forgot-wrap">
                <button 
                  type="button"
                  className="login-forgot-link"
                  onClick={openResetModal}> 
                    Esqueceu a senha?
                  </button>
              </div>
            </form>
          </div>
        </div>
      </div>
 
      {resetModalOpen && (
        <div className="reset-overlay" onClick={closeResetModal}>
          <div className="reset-modal" onClick={(e) => e.stopPropagation()}>
            <div className="reset-modal-header">
              <h3 className="reset-modal-title">Recuperar senha</h3>
              <button
                className="reset-modal-close"
                onClick={closeResetModal}
                aria-label="Fechar"
                type="button"
              >
                <X size={18} />
              </button>
            </div>
 
            {resetStatus === "sent" ? (
              <div className="reset-success">
                <p>E-mail enviado com sucesso!</p>
                <p className="reset-success-sub">
                  Verifique a caixa de entrada de <strong>{resetEmail}</strong> e siga as instruções para redefinir sua senha.
                </p>
                <button
                  className="reset-modal-button"
                  type="button"
                  onClick={closeResetModal}
                >
                  Fechar
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetSubmit} noValidate>
                <p className="reset-modal-text">
                  Digite o e-mail da sua conta e enviaremos um link para redefinir sua senha.
                </p>
 
                {resetStatus === "error" && (
                  <div className="login-error" style={{ marginBottom: "1rem" }}>
                    <AlertCircle size={16} aria-hidden />
                    <span>{resetError}</span>
                  </div>
                )}
 
                <div className="login-right-field">
                  <label htmlFor="reset-email" className="login-right-label">E-mail</label>
                  <div className="login-right-input-wrap">
                    <Mail className="login-right-input-icon" size={18} aria-hidden />
                    <input
                      id="reset-email"
                      className="login-right-input login-right-input--with-icon"
                      type="email"
                      placeholder="seu@email.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      autoComplete="email"
                      autoFocus
                    />
                  </div>
                </div>
 
                <button
                  className="reset-modal-button"
                  type="submit"
                  disabled={resetStatus === "sending"}
                >
                  {resetStatus === "sending"
                    ? <LoaderCircle size={18} className="login-spinner" aria-hidden />
                    : "Enviar link de recuperação"
                  }
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}