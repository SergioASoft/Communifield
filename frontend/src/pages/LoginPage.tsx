import React, { useState } from "react";
import { Mail, Lock, ArrowRight, User, Phone, Eye, EyeOff, Apple, Users, } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import type { ApiError } from "../services/api";
import "../styles/auth.css";
import HomePage from "./HomePage";

type Mode = "login" | "register";
type RegisterType = "organizer" | "player";

type FormState = {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  type: RegisterType;
  remember: boolean;
};

const initialForm: FormState = {
  name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  type: "player",
  remember: false,
};

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone: string) {
  return /^[0-9+\s-]{7,20}$/.test(phone);
}

function validatePassword(password: string) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(
    password
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const setField = (name: keyof FormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const next: Record<string, string> = {};

    if (!validateEmail(form.email)) {
      next.email = "Ingresa un correo electronico valido.";
    }

    if (!form.password) {
      next.password = "La contrasena es obligatoria.";
    }

    if (mode === "register") {
      if (form.name.trim().length < 2) {
        next.name = "El nombre debe tener minimo 2 caracteres.";
      }

      if (!validatePhone(form.phone)) {
        next.phone =
          "Ingresa un telefono valido, solo numeros, +, espacios o guiones.";
      }

      if (!validatePassword(form.password)) {
        next.password =
          "Minimo 8 caracteres, mayuscula, minuscula, numero y simbolo.";
      }

      if (form.password !== form.confirmPassword) {
        next.confirmPassword = "Las contrasenas no coinciden.";
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);

    if (!validate()) {
      setAlert({
        type: "error",
        text: "Revisa los campos marcados. Hay informacion invalida.",
      });
      return;
    }

    setLoading(true);

    try {
      if (mode === "login") {
        const res = await api.login({
          email: form.email,
          password: form.password,
        });

        localStorage.setItem("communifield_token", res.token);
        localStorage.setItem("communifield_user", JSON.stringify(res.user));

        setAlert({
          type: "success",
          text: "Inicio de sesion exitoso. Token guardado correctamente.",
        });

        navigate(
          res.redirectTo ||
          res.user?.redirectTo ||
          (res.user?.type === "admin" ? "/usuarios" : "/canchas")
        );
      } else {
        const res = await api.register({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          type: form.type,
        });

        setAlert({
          type: "success",
          text: res.message || "Registro exitoso. Revisa tu correo para verificar la cuenta.",
        });

        setMode("login");
        setForm((prev) => ({
          ...initialForm,
          email: prev.email,
          type: prev.type,
        }));
      }
    } catch (err) {
      const apiError = err as ApiError;
      const fieldErrors: Record<string, string> = {};

      if (apiError.errors) {
        Object.entries(apiError.errors).forEach(([key, value]) => {
          fieldErrors[key] = value?.[0] || "Campo invalido";
        });
      }

      setErrors(fieldErrors);
      setAlert({
        type: "error",
        text:
          apiError.message ||
          "No fue posible conectar con el servidor. Revisa backend, puerto y base de datos.",
      });
    } finally {
      setLoading(false);
    }
  };

  return <main className="page">
    <section className="auth-card">
      <button className="brand brand-button" type="button" onClick={() => navigate("/")}>CommuniField <span /></button>
      <button className="back-button auth-back-button" type="button" onClick={() => navigate("/")}>← Retroceder</button>

        <h1>
          Vive el futbol como <strong>nunca</strong>
        </h1>

        <p className="subtitle">
          Ingresa para gestionar tu cancha o conectarte con toda la comunidad
        </p>

        {alert && <div className={`alert ${alert.type}`}>{alert.text}</div>}

        <form onSubmit={submit} noValidate>
          {mode === "register" && (
            <>
              <Field label="Tipo de registro" icon={<Users size={16} />}>
                <select
                  value={form.type}
                  onChange={(e) =>
                    setField("type", e.target.value as RegisterType)
                  }
                >
                  <option value="player">Jugador</option>
                  <option value="organizer">Gestor</option>
                </select>
              </Field>

              <Field
                label="Nombre completo"
                icon={<User size={16} />}
                error={errors.name}
              >
                <input
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  placeholder="Camila Torres"
                />
              </Field>

              <Field
                label="Telefono"
                icon={<Phone size={16} />}
                error={errors.phone}
              >
                <input
                  value={form.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                  placeholder="3001234567"
                />
              </Field>
            </>
          )}

          <Field
            label="Correo electronico"
            icon={<Mail size={16} />}
            error={errors.email}
          >
            <input
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              placeholder="communifield@gmail.com"
              autoComplete="email"
            />
          </Field>

          <Field
            label="Contrasena"
            icon={<Lock size={16} />}
            error={errors.password}
            right={
              mode === "login" ? (
                <button
                  type="button"
                  className="forgot-inline"
                  onClick={() => navigate("/forgot-password")}
                >
                  No la recuerdas?
                </button>
              ) : undefined
            }
          >
            <input
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(e) => setField("password", e.target.value)}
              placeholder="********"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />

            <button
              className="eye"
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowPassword((prev) => !prev);
              }}
              aria-label="Mostrar u ocultar contrasena"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </Field>

          {mode === "register" && (
            <Field
              label="Confirmar contrasena"
              icon={<Lock size={16} />}
              error={errors.confirmPassword}
            >
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setField("confirmPassword", e.target.value)}
                placeholder="********"
              />
            </Field>
          )}

          {mode === "login" && (
            <label className="remember">
              <input
                type="checkbox"
                checked={form.remember}
                onChange={(e) => setField("remember", e.target.checked)}
              />{" "}
              Mantener la sesion iniciada
            </label>
          )}

          <button className="submit" disabled={loading}>
            {loading
              ? "Procesando..."
              : mode === "login"
                ? "Ingresar"
                : "Crear cuenta"}{" "}
            <ArrowRight size={19} />
          </button>
        </form>

        <div className="divider">
          <span>INGRESAR MEDIANTE</span>
        </div>

        <div className="oauth">
          <button
            type="button"
            onClick={() =>
              setAlert({
                type: "error",
                text: "OAuth Google requiere configurar Client ID en backend.",
              })
            }
          >
            <b className="g">G</b> Google
          </button>

          <button
            type="button"
            onClick={() =>
              setAlert({
                type: "error",
                text: "OAuth Apple pendiente de configurar.",
              })
            }
          >
            <Apple size={19} /> Apple
          </button>
        </div>

        <p className="swap">
          {mode === "login" ? "Eres nuevo en esto?" : "Ya tienes cuenta?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setAlert(null);
              setErrors({});
            }}
          >
            {mode === "login" ? "Crear cuenta" : "Iniciar sesion"}
          </button>
        </p>

        <div className="stats">
          <div>
            <small>JUEGOS DISPONIBLES</small>
            <b>1,429</b>
          </div>
          <div>
            <small>JUGADORES ACTIVOS</small>
            <b>84K</b>
          </div>
        </div>
      </section>
    </main>
  ;
}

function Field({
  label,
  icon,
  error,
  right,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  error?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <div className="label-row">
        <span>{label}</span>
        {right && <div className="label-action">{right}</div>}
      </div>

      <div className={`input-wrap ${error ? "invalid" : ""}`}>
        {icon}
        {children}
      </div>

      {error && <small className="error">{error}</small>}
    </label>
  );
}