import "./style.css";
import { Mail, Lock } from "lucide-react";

import AppIcon from "../../assets/icons/app-icon.svg";

export default function Login() {
  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-left-content">
          <div className="login-left-image">
            <img className="login-left-image-icon" src={AppIcon} alt="logo"/>
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

            <div className="login-right-field">
                <label htmlFor="email" className="login-right-label">Email</label>
                <div className="login-right-input-wrap">
                    <Mail className="login-right-input-icon" size={18} aria-hidden />
                    <input
                        id="email"
                        className="login-right-input login-right-input--with-icon"
                        type="email"
                        placeholder="seu@email.com"
                    />
                </div>
            </div>

            <div className="login-right-field">
                <label htmlFor="senha" className="login-right-label">Senha</label>
                <div className="login-right-input-wrap">
                    <Lock className="login-right-input-icon" size={18} aria-hidden />
                    <input
                        id="senha"
                        className="login-right-input login-right-input--with-icon"
                        type="password"
                        placeholder="********"
                    />
                </div>
            </div>

            <button className="login-right-button">Login</button>
        </div>
      </div>
    </div>
  );
}
