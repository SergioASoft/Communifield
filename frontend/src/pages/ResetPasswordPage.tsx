import React, { useState } from "react";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Lock } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api";
import type { ApiError } from "../services/api";
import "../styles/auth.css";

function validatePassword(password: string) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password);
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [alert, setAlert] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);

    const next: Record<string, string> = {};
    if (!token) next.token = "El enlace de recuperacion no es valido.";
    if (!validatePassword(password)) next.password = "Minimo 8 caracteres, mayuscula, minuscula, numero y simbolo.";
    if (password !== confirmPassword) next.confirmPassword = "Las contrasenas no coinciden.";
    setErrors(next);

    if (Object.keys(next).length) {
      setAlert({ type: "error", text: "Revisa los campos marcados. Hay informacion invalida." });
      return;
    }

    setLoading(true);
    try {
      const res = await api.resetPassword({ token: token as string, password });
      setAlert({ type: "success", text: res.message || "Contraseña actualizada correctamente." });
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      const apiError = err as ApiError;
      setAlert({ type: "error", text: apiError.message || "No fue posible actualizar la contraseña." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page">
      <section className="auth-card">
        <button type="button" className="back-button" onClick={() => navigate("/login")}> <ArrowLeft size={17} /> Volver</button>
        <div className="brand">CommuniField <span /></div>
        <h1>Crea una nueva <strong>contraseña</strong></h1>
        <p className="subtitle">Usa una contraseña segura para proteger tu cuenta de CommuniField.</p>

        {alert && <div className={`alert ${alert.type}`}>{alert.text}</div>}
        {errors.token && <small className="error auth-error-block">{errors.token}</small>}

        <form onSubmit={submit} noValidate>
          <label className="field">
            <div className="label-row"><span>Nueva contraseña</span></div>
            <div className={`input-wrap ${errors.password ? "invalid" : ""}`}>
              <Lock size={16} />
              <input type={showPassword ? "text" : "password"} value={password} onChange={e => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: "" })); }} placeholder="********" autoComplete="new-password" />
              <button className="eye" type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </div>
            {errors.password && <small className="error">{errors.password}</small>}
          </label>

          <label className="field">
            <div className="label-row"><span>Confirmar contraseña</span></div>
            <div className={`input-wrap ${errors.confirmPassword ? "invalid" : ""}`}>
              <Lock size={16} />
              <input type="password" value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setErrors(prev => ({ ...prev, confirmPassword: "" })); }} placeholder="********" autoComplete="new-password" />
            </div>
            {errors.confirmPassword && <small className="error">{errors.confirmPassword}</small>}
          </label>

          <button className="submit" disabled={loading}>{loading ? "Guardando..." : "Actualizar contraseña"} <ArrowRight size={19} /></button>
        </form>

        <p className="swap">Quieres entrar ahora? <button type="button" onClick={() => navigate("/login")}>Iniciar sesion</button></p>
      </section>
    </main>
  );
}
