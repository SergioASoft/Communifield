import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { Mail, Lock, ArrowRight, User, Phone, Eye, EyeOff, Apple } from "lucide-react";
import { api, ApiError } from "./services/api";
import "./styles/auth.css";

type Mode = "login" | "register";
type Role = "gestor" | "player";

type FormState = {
  name: string; username: string; email: string; phone: string; password: string; confirmPassword: string; role: Role; remember: boolean;
};

const initialForm: FormState = { name: "", username: "", email: "", phone: "", password: "", confirmPassword: "", role: "gestor", remember: false };

function validateEmail(email: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
function validatePhone(phone: string) { return /^[0-9+\s-]{7,20}$/.test(phone); }
function validatePassword(password: string) { return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password); }

function App() {
  const [mode, setMode] = useState<Mode>("login");
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [alert, setAlert] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const setField = (name: keyof FormState, value: string | boolean) => {
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!validateEmail(form.email)) next.email = "Ingresa un correo electrónico válido.";
    if (!form.password) next.password = "La contraseña es obligatoria.";
    if (mode === "register") {
      if (form.name.trim().length < 2) next.name = "El nombre debe tener mínimo 2 caracteres.";
      if (!/^[a-zA-Z0-9_]{3,30}$/.test(form.username)) next.username = "Usuario: 3 a 30 caracteres, letras, números o _.";
      if (!validatePhone(form.phone)) next.phone = "Ingresa un teléfono válido, solo números, +, espacios o guiones.";
      if (!validatePassword(form.password)) next.password = "Mínimo 8 caracteres, mayúscula, minúscula, número y símbolo.";
      if (form.password !== form.confirmPassword) next.confirmPassword = "Las contraseñas no coinciden.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);
    if (!validate()) {
      setAlert({ type: "error", text: "Revisa los campos marcados. Hay información inválida." });
      return;
    }
    setLoading(true);
    try {
      if (mode === "login") {
        const res = await api.login({ email: form.email, password: form.password, role: form.role });
        localStorage.setItem("communifield_token", res.token);
        localStorage.setItem("communifield_user", JSON.stringify(res.user));
        setAlert({ type: "success", text: "Inicio de sesión exitoso. Token guardado correctamente." });
      } else {
        const res = await api.register({ name: form.name, username: form.username, email: form.email, phone: form.phone, password: form.password, role: form.role });
        setAlert({ type: "success", text: res.message || "Registro exitoso." });
        setMode("login");
        setForm(prev => ({ ...initialForm, email: prev.email, role: prev.role }));
      }
    } catch (err) {
      const apiError = err as ApiError;
      const fieldErrors: Record<string, string> = {};
      if (apiError.errors) Object.entries(apiError.errors).forEach(([key, value]) => { fieldErrors[key] = value?.[0] || "Campo inválido"; });
      setErrors(fieldErrors);
      setAlert({ type: "error", text: apiError.message || "No fue posible conectar con el servidor. Revisa backend, puerto y base de datos." });
    } finally { setLoading(false); }
  };

  return <main className="page">
    <section className="auth-card">
      <div className="brand">CommuniField <span /></div>
      <h1>Vive el fútbol como <strong>nunca</strong></h1>
      <p className="subtitle">Ingresa para gestionar tu cancha o conectarte con toda la comunidad</p>

      <label className="role-switch">
        <input type="checkbox" checked={form.role === "gestor"} onChange={e => setField("role", e.target.checked ? "gestor" : "player")} />
        <span className="slider" /> Soy un Gestor
      </label>

      {alert && <div className={`alert ${alert.type}`}>{alert.text}</div>}

      <form onSubmit={submit} noValidate>
        {mode === "register" && <>
          <Field label="Nombre completo" icon={<User size={16}/>} error={errors.name}><input value={form.name} onChange={e => setField("name", e.target.value)} placeholder="Camila Torres" /></Field>
          <Field label="Nombre de usuario" icon={<User size={16}/>} error={errors.username}><input value={form.username} onChange={e => setField("username", e.target.value)} placeholder="camila_gestor" /></Field>
          <Field label="Teléfono" icon={<Phone size={16}/>} error={errors.phone}><input value={form.phone} onChange={e => setField("phone", e.target.value)} placeholder="3001234567" /></Field>
        </>}

        <Field label="Correo electrónico" icon={<Mail size={16}/>} error={errors.email}><input value={form.email} onChange={e => setField("email", e.target.value)} placeholder="communifield@gmail.com" autoComplete="email" /></Field>

        <Field label="Contraseña" right={mode === "login" ? "No la recuerdas?" : undefined} icon={<Lock size={16}/>} error={errors.password}>
          <input type={showPassword ? "text" : "password"} value={form.password} onChange={e => setField("password", e.target.value)} placeholder="••••••••" autoComplete={mode === "login" ? "current-password" : "new-password"} />
          <button className="eye" type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
        </Field>

        {mode === "register" && <Field label="Confirmar contraseña" icon={<Lock size={16}/>} error={errors.confirmPassword}><input type="password" value={form.confirmPassword} onChange={e => setField("confirmPassword", e.target.value)} placeholder="••••••••" /></Field>}

        {mode === "login" && <label className="remember"><input type="checkbox" checked={form.remember} onChange={e => setField("remember", e.target.checked)} /> Mantener la sesión iniciada</label>}

        <button className="submit" disabled={loading}>{loading ? "Procesando..." : mode === "login" ? "Ingresar" : "Crear cuenta"} <ArrowRight size={19}/></button>
      </form>

      <div className="divider"><span>INGRESAR MEDIANTE</span></div>
      <div className="oauth">
        <button onClick={() => setAlert({ type: "error", text: "OAuth Google requiere configurar Client ID en backend." })}><b className="g">G</b> Google</button>
        <button onClick={() => setAlert({ type: "error", text: "OAuth Apple pendiente de configurar." })}><Apple size={19}/> Apple</button>
      </div>

      <p className="swap">{mode === "login" ? "Eres nuevo en esto?" : "Ya tienes cuenta?"} <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setAlert(null); setErrors({}); }}>{mode === "login" ? "Crear cuenta" : "Iniciar sesión"}</button></p>

      <div className="stats"><div><small>JUEGOS DISPONIBLES</small><b>1,429</b></div><div><small>JUGADORES ACTIVOS</small><b>84K</b></div></div>
    </section>
  </main>;
}

function Field({ label, icon, error, right, children }: { label: string; icon: React.ReactNode; error?: string; right?: string; children: React.ReactNode }) {
  return <label className="field"><div className="label-row"><span>{label}</span>{right && <em>{right}</em>}</div><div className={`input-wrap ${error ? "invalid" : ""}`}>{icon}{children}</div>{error && <small className="error">{error}</small>}</label>;
}

createRoot(document.getElementById("root")!).render(<App />);
