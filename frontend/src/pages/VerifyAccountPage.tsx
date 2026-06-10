import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, LoaderCircle, XCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api";
import type { ApiError } from "../services/api";
import "../styles/auth.css";

export default function VerifyAccountPage() {
  const navigate = useNavigate();
  const { token } = useParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verificando tu cuenta...");

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus("error");
        setMessage("El enlace de verificacion no es valido.");
        return;
      }

      try {
        const res = await api.verifyAccount(token);
        setStatus("success");
        setMessage(res.message || "Correo verificado correctamente. Ya puedes iniciar sesion.");
      } catch (err) {
        const apiError = err as ApiError;
        setStatus("error");
        setMessage(apiError.message || "No fue posible verificar la cuenta. El enlace puede estar vencido o ya usado.");
      }
    };

    verify();
  }, [token]);

  return (
    <main className="page">
      <section className="auth-card auth-center-card">
        <button type="button" className="back-button" onClick={() => navigate("/login")}> <ArrowLeft size={17} /> Volver</button>
        <div className="brand">CommuniField <span /></div>

        <div className={`status-icon ${status}`}>
          {status === "loading" && <LoaderCircle size={54} />}
          {status === "success" && <CheckCircle2 size={54} />}
          {status === "error" && <XCircle size={54} />}
        </div>

        <h1>{status === "success" ? "Cuenta verificada" : status === "error" ? "No se pudo verificar" : "Verificando cuenta"}</h1>
        <p className="subtitle center-text">{message}</p>

        <button className="submit" type="button" onClick={() => navigate("/login")}>Ir al login</button>
      </section>
    </main>
  );
}
