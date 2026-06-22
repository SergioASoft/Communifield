import React, { useState } from "react";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import type { ApiError } from "../services/api";
import "../styles/auth.css";

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [alert, setAlert] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);
    setError("");

    if (!validateEmail(email)) {
      setError("Ingresa un correo electronico valido.");
      setAlert({ type: "error", text: "Revisa el correo antes de continuar." });
      return;
    }

    setLoading(true);
    try {
      const res = await api.forgotPassword({ email });
      setAlert({ type: "success", text: res.message || "Te enviamos un enlace para recuperar tu contraseña." });
    } catch (err) {
      const apiError = err as ApiError;
      setAlert({ type: "error", text: apiError.message || "No fue posible enviar el correo de recuperacion." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page">
      <section className="auth-card">
        <button type="button" className="back-button" onClick={() => navigate("/login")}> <ArrowLeft size={17} /> Volver</button>
        <button className="brand brand-button" type="button" onClick={() => navigate("/")}>CommuniField <span /></button>
        <h1>Recupera tu <strong>contraseña</strong></h1>
        <p className="subtitle">Escribe tu correo y te enviaremos un enlace seguro para crear una nueva contraseña.</p>

        {alert && <div className={`alert ${alert.type}`}>{alert.text}</div>}

        <form onSubmit={submit} noValidate>
          <label className="field">
            <div className="label-row"><span>Correo electronico</span></div>
            <div className={`input-wrap ${error ? "invalid" : ""}`}>
              <Mail size={16} />
              <input value={email} onChange={e => { setEmail(e.target.value); setError(""); }} placeholder="communifield@gmail.com" autoComplete="email" />
            </div>
            {error && <small className="error">{error}</small>}
          </label>

          <button className="submit" disabled={loading}>{loading ? "Enviando..." : "Enviar enlace"} <ArrowRight size={19} /></button>
        </form>

        <p className="swap">Ya recordaste tu contraseña? <button type="button" onClick={() => navigate("/login")}>Iniciar sesion</button></p>
      </section>
    </main>
  );
}
