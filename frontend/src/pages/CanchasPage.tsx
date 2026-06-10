import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "../styles/HomePage.css";

import Header from "../components/Header";
import Footer from "../components/Footer";
import { Usuario } from "../types";

interface CanchaDB {
  id_espacio: number;
  nombre: string;
  tipo: string;
  ubicacion: string;
  distancia?: string | null;
  superficie?: string | null;
  precio_hora: number;
  rating: number;
  total_resenas: number;
  disponible_hoy: boolean | number;
  imagen_principal?: string | null;
  estado: string;
}

function getInitials(name: string) {
  return name
    .trim()
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function getUsuarioSesion(): Usuario | undefined {
  try {
    const raw = localStorage.getItem("communifield_user");

    if (!raw) return undefined;

    const user = JSON.parse(raw);

    return {
      nombre: user.name || user.nombre || "Usuario",
      email: user.email || "",
      iniciales: getInitials(user.name || user.nombre || "Usuario"),
      avatarUrl: user.photo || user.avatarUrl || undefined,
    };
  } catch {
    return undefined;
  }
}

export default function CanchasPage() {
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState<Usuario | undefined>(undefined);

  const [canchas, setCanchas] = useState<CanchaDB[]>([]);
  const [canchasFiltradas, setCanchasFiltradas] = useState<CanchaDB[]>([]);

  const [ciudad, setCiudad] = useState("");
  const [tipo, setTipo] = useState("");
  const [superficie, setSuperficie] = useState("");
  const [orden, setOrden] = useState("mejor");

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setUsuario(getUsuarioSesion());
  }, []);

  useEffect(() => {
    cargarCanchas();
  }, []);

  async function cargarCanchas() {
    try {
      setCargando(true);
      setError("");

      const res = await fetch("/api/canchas");

      if (!res.ok) {
        throw new Error("No se pudieron cargar las canchas");
      }

      const data = await res.json();

      setCanchas(data);
      setCanchasFiltradas(data);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las canchas. Revisa el backend o la base de datos.");
    } finally {
      setCargando(false);
    }
  }

  function buscarCanchas() {
    let resultado = [...canchas];

    if (ciudad.trim()) {
      resultado = resultado.filter((cancha) =>
        cancha.ubicacion?.toLowerCase().includes(ciudad.toLowerCase())
      );
    }

    if (tipo) {
      resultado = resultado.filter((cancha) =>
        cancha.tipo?.toLowerCase() === tipo.toLowerCase()
      );
    }

    if (superficie) {
      resultado = resultado.filter((cancha) =>
        cancha.superficie?.toLowerCase() === superficie.toLowerCase()
      );
    }

    if (orden === "mejor") {
      resultado.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    }

    if (orden === "menor") {
      resultado.sort((a, b) => Number(a.precio_hora || 0) - Number(b.precio_hora || 0));
    }

    if (orden === "mayor") {
      resultado.sort((a, b) => Number(b.precio_hora || 0) - Number(a.precio_hora || 0));
    }

    setCanchasFiltradas(resultado);
  }

  useEffect(() => {
    buscarCanchas();
  }, [orden]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header usuario={usuario} />

      <main style={{ flex: 1, maxWidth: 1200, width: "100%", margin: "0 auto", padding: "30px 40px 60px" }}>
        <button
          type="button"
          onClick={() => window.history.back()}
          style={{
            border: "2px solid rgba(0,171,0,0.18)",
            background: "white",
            color: "#00ab00",
            fontWeight: 700,
            padding: "10px 18px",
            borderRadius: 9,
            cursor: "pointer",
            marginBottom: 30,
          }}
        >
          ← Retroceder
        </button>

        <section style={{ textAlign: "center", marginBottom: 40 }}>
          <p style={{ color: "#65c25d", fontWeight: 700, letterSpacing: 2 }}>
            ENCUENTRA TU CANCHA
          </p>

          <h1
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 60,
              letterSpacing: 2,
              margin: "10px 0 30px",
              color: "#0e260e",
            }}
          >
            ¿Dónde quieres <span style={{ color: "#00ab00" }}>jugar hoy?</span>
          </h1>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              justifyContent: "center",
              background: "white",
              border: "1.5px solid rgba(0,171,0,0.18)",
              padding: 10,
              borderRadius: 14,
              boxShadow: "0 4px 24px rgba(0,171,0,0.09)",
            }}
          >
            <input
              type="text"
              placeholder="Ciudad, barrio o ubicación..."
              value={ciudad}
              onChange={(e) => setCiudad(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && buscarCanchas()}
              style={inputStyle}
            />

            <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={inputStyle}>
              <option value="">Tipo de cancha</option>
              <option value="Fútbol 5">Fútbol 5</option>
              <option value="Fútbol 7">Fútbol 7</option>
              <option value="Fútbol 11">Fútbol 11</option>
            </select>

            <select value={superficie} onChange={(e) => setSuperficie(e.target.value)} style={inputStyle}>
              <option value="">Superficie</option>
              <option value="Sintética Premium">Sintética Premium</option>
              <option value="Césped Natural">Césped Natural</option>
              <option value="Grama sintetica">Grama sintética</option>
              <option value="Cemento">Cemento</option>
            </select>

            <button
              onClick={buscarCanchas}
              style={{
                background: "#00ab00",
                color: "white",
                border: "none",
                borderRadius: 9,
                padding: "13px 28px",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Buscar canchas
            </button>
          </div>
        </section>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
            gap: 14,
            flexWrap: "wrap",
          }}
        >
          <p style={{ color: "#6e8f6e", fontWeight: 700 }}>
            {cargando
              ? "Buscando canchas..."
              : `${canchasFiltradas.length} cancha${canchasFiltradas.length !== 1 ? "s" : ""} encontrada${canchasFiltradas.length !== 1 ? "s" : ""}`}
          </p>

          <select value={orden} onChange={(e) => setOrden(e.target.value)} style={ordenStyle}>
            <option value="mejor">Mejor valoradas</option>
            <option value="menor">Menor precio</option>
            <option value="mayor">Mayor precio</option>
          </select>
        </div>

        {error && (
          <div style={{ textAlign: "center", color: "#c0392b", padding: 40 }}>
            <p>{error}</p>
            <button onClick={cargarCanchas}>Reintentar</button>
          </div>
        )}

        {!error && cargando && <p>Cargando canchas...</p>}

        {!error && !cargando && canchasFiltradas.length === 0 && (
          <div style={{ textAlign: "center", padding: 60, color: "#6e8f6e" }}>
            <p style={{ fontSize: 40 }}></p>
            <h3>Sin resultados</h3>
            <p>Intenta con otros filtros.</p>
          </div>
        )}

        {!error && !cargando && canchasFiltradas.length > 0 && (
          <section
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
              gap: 20,
            }}
          >
            {canchasFiltradas.map((cancha) => (
              <article
                key={cancha.id_espacio}
                onClick={() => navigate(`/canchas/${cancha.id_espacio}`)}
                style={{
                  background: "white",
                  border: "1.5px solid rgba(0,171,0,0.18)",
                  borderRadius: 16,
                  overflow: "hidden",
                  cursor: "pointer",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
                }}
              >
                <div
                  style={{
                    height: 170,
                    background: "#edf7ed",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {cancha.imagen_principal ? (
  <img
    src={cancha.imagen_principal}
    alt={cancha.nombre}
    style={{
      width: "100%",
      height: "100%",
      objectFit: "cover",
    }}
  />
) : (
  <div
    style={{
      height: "100%",
      background: "#edf7ed",
    }}
  />
)}

                  <span style={badgeTipo}>{cancha.tipo}</span>
                </div>

                <div style={{ padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <h3 style={{ margin: 0, fontSize: 17, color: "#0e260e" }}>
                      {cancha.nombre}
                    </h3>

                    <span style={{ color: "#b2d100", fontWeight: 800 }}>
                      ★ {cancha.rating || 0}
                    </span>
                  </div>

                  <p style={{ color: "#6e8f6e", fontSize: 13, margin: "8px 0" }}>
                    {cancha.ubicacion}
                  </p>

                  <p style={{ color: "#6e8f6e", fontSize: 12 }}>
                    {cancha.superficie || "Sin superficie registrada"}
                  </p>

                  <div
                    style={{
                      borderTop: "1.5px solid rgba(0,171,0,0.18)",
                      marginTop: 12,
                      paddingTop: 12,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <strong style={{ color: "#00ab00", fontSize: 20 }}>
                      ${Number(cancha.precio_hora || 0).toLocaleString("es-CO")}
                      <span style={{ fontSize: 12, color: "#6e8f6e" }}> / hora</span>
                    </strong>

                    {Boolean(cancha.disponible_hoy) ? (
                      <span style={disponibleStyle}>Disponible</span>
                    ) : (
                      <span style={ocupadaStyle}>Ocupada</span>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  minWidth: 190,
  flex: "1 1 190px",
  border: "none",
  background: "#edf7ed",
  padding: "13px 14px",
  borderRadius: 9,
  outline: "none",
  color: "#0e260e",
  fontFamily: "'Outfit', sans-serif",
};

const ordenStyle: React.CSSProperties = {
  border: "1.5px solid rgba(0,171,0,0.18)",
  background: "white",
  padding: "9px 12px",
  borderRadius: 8,
  fontWeight: 700,
  color: "#0e260e",
};

const badgeTipo: React.CSSProperties = {
  position: "absolute",
  bottom: 10,
  left: 10,
  background: "#00ab00",
  color: "white",
  fontSize: 11,
  fontWeight: 700,
  padding: "4px 10px",
  borderRadius: 999,
};

const disponibleStyle: React.CSSProperties = {
  color: "#00ab00",
  background: "#edf7ed",
  border: "1px solid rgba(0,171,0,0.18)",
  padding: "4px 9px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 800,
};

const ocupadaStyle: React.CSSProperties = {
  color: "#c0392b",
  background: "rgba(192,57,43,0.07)",
  border: "1px solid rgba(192,57,43,0.2)",
  padding: "4px 9px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 800,
};