import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { subscriptionService } from "../services/subscriptionService";

export default function SubscriptionSuccessPage() {
  const [params] = useSearchParams();
  const [message, setMessage] = useState("Confirmando tu suscripción...");
  const [error, setError] = useState("");

  useEffect(() => {
    const sessionId = params.get("session_id");

    if (!sessionId) {
      setError("No llegó el identificador de la sesión de Stripe.");
      return;
    }

    subscriptionService
      .confirmCheckout(sessionId)
      .then(() => {
        setMessage("Suscripción activada correctamente. Tus canchas ya se pueden mostrar en la plataforma.");
      })
      .catch((err) => {
        setError(err?.message || "No se pudo confirmar la suscripción.");
      });
  }, [params]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />

      <main style={page}>
        <section style={card}>
          <p style={tag}>STRIPE SANDBOX</p>
          <h1 style={title}>Estado de suscripción</h1>

          {error ? (
            <p style={{ color: "#c0392b", fontWeight: 800 }}>{error}</p>
          ) : (
            <p style={{ color: "#286b28", fontWeight: 800 }}>{message}</p>
          )}

          <Link to="/gestor/mis-canchas" style={button}>
            Volver a mis canchas
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}

const page: React.CSSProperties = {
  flex: 1,
  display: "grid",
  placeItems: "center",
  padding: 30,
  background: "#edf7ed",
};

const card: React.CSSProperties = {
  maxWidth: 560,
  width: "100%",
  background: "white",
  borderRadius: 18,
  padding: 28,
  border: "1.5px solid rgba(0,171,0,0.18)",
  boxShadow: "0 16px 35px rgba(0,0,0,0.08)",
};

const tag: React.CSSProperties = {
  color: "#00ab00",
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: 2,
};

const title: React.CSSProperties = {
  marginTop: 0,
  color: "#0e260e",
};

const button: React.CSSProperties = {
  display: "inline-block",
  marginTop: 20,
  background: "#00ab00",
  color: "white",
  textDecoration: "none",
  borderRadius: 10,
  padding: "13px 18px",
  fontWeight: 900,
};
