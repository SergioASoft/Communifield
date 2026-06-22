import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Usuario } from "../types";
import { HORARIOS_SELECT } from "../data/canchaData";

interface Resena {
  nombre?: string;
  iniciales?: string;
  estrellas?: number;
  texto?: string;
  fecha?: string;
  foto?: string;
  photo?: string;
  avatarUrl?: string;
  avatar_url?: string;
  imagen_usuario?: string;
  usuario_foto?: string;
}

interface Cancha {
  id_espacio: number;
  fk_id_dueño?: number;
  nombre: string;
  tipo: string;
  ubicacion: string;
  distancia?: string | null;
  superficie?: string | null;
  descripcion?: string[] | string | null;
  caracteristicas?: string[] | string | null;
  precio_hora: number;
  rating: number;
  total_resenas: number;
  disponible_hoy: boolean | number;
  imagen_principal?: string | null;
  imagenes?: string[] | string | null;
  resenas?: Resena[] | string | null;
  estado: string;
}

function getUser() {
  const raw = localStorage.getItem("communifield_user");
  return raw ? JSON.parse(raw) : null;
}

function getUsuarioHeader(): Usuario | undefined {
  const user = getUser();
  if (!user) return undefined;

  const nombre = user.name || user.nombre || "Gestor";

  return {
    nombre,
    email: user.email || "",
    iniciales: nombre
      .split(" ")
      .slice(0, 2)
      .map((p: string) => p[0])
      .join("")
      .toUpperCase(),
    avatarUrl: user.photo || user.avatarUrl || undefined,
  };
}

function parseList(value: any): any[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "object") return [value];

  if (typeof value === "string") {
    const cleanValue = value.trim();
    if (!cleanValue) return [];

    if (cleanValue.startsWith("data:image")) return [cleanValue];

    try {
      const parsed = JSON.parse(cleanValue);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return cleanValue
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean);
    }
  }

  return [];
}

function getReviewPhoto(resena: Resena): string | undefined {
  return (
    resena.foto ||
    resena.photo ||
    resena.avatarUrl ||
    resena.avatar_url ||
    resena.imagen_usuario ||
    resena.usuario_foto ||
    undefined
  );
}

function getReviewInitials(resena: Resena): string {
  if (resena.iniciales) return resena.iniciales;

  const nombre = resena.nombre || "Usuario";

  return nombre
    .trim()
    .split(" ")
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();
}

export default function GestionCanchaDetallePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [usuario] = useState<Usuario | undefined>(getUsuarioHeader());
  const [cancha, setCancha] = useState<Cancha | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [openSlotForm, setOpenSlotForm] = useState({
    fecha: "",
    hora: "",
    duracion: 1,
    participantes: 10,
  });
  const [openSlotMessage, setOpenSlotMessage] = useState("");
  const [creandoOpenSlot, setCreandoOpenSlot] = useState(false);

  async function cargarCancha() {
    try {
      setCargando(true);
      setError("");

      const res = await fetch(`/api/canchas/${id}`);

      if (!res.ok) {
        throw new Error("No se pudo cargar la cancha");
      }

      const data = await res.json();
      setCancha(data);
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar la información de la cancha.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    if (id) cargarCancha();
  }, [id]);

  async function crearEspacioAbierto(e: React.FormEvent) {
    e.preventDefault();

    const token = localStorage.getItem("communifield_token");

    if (!token) {
      setOpenSlotMessage("Inicia sesion como gestor para crear espacios abiertos.");
      return;
    }

    setCreandoOpenSlot(true);
    setOpenSlotMessage("");

    try {
      const res = await fetch(`/api/reservas/canchas/${id}/espacios-abiertos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(openSlotForm),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "No se pudo crear el espacio abierto");
      }

      const cuota = Number(data.espacioAbierto?.cuotaParticipante || 0).toLocaleString(
        "es-CO",
        {
          style: "currency",
          currency: "COP",
          maximumFractionDigits: 0,
        }
      );

      setOpenSlotMessage(`Espacio abierto creado. Cuota por jugador: ${cuota}.`);
    } catch (err: any) {
      setOpenSlotMessage(err.message || "No se pudo crear el espacio abierto.");
    } finally {
      setCreandoOpenSlot(false);
    }
  }

  if (cargando) {
    return (
      <div>
        <Header usuario={usuario} />
        <main style={page}>Cargando información...</main>
        <Footer />
      </div>
    );
  }

  if (error || !cancha) {
    return (
      <div>
        <Header usuario={usuario} />
        <main style={page}>
          <button style={backButton} onClick={() => navigate(-1)}>
            ← Volver
          </button>

          <p style={{ color: "#c0392b", fontWeight: 800 }}>
            {error || "Cancha no encontrada."}
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  const descripcion = parseList(cancha.descripcion);
  const caracteristicas = parseList(cancha.caracteristicas);
  const imagenes = parseList(cancha.imagenes);
  const resenas = parseList(cancha.resenas);

  const disponibleHoy =
    cancha.estado === "activo" && Boolean(cancha.disponible_hoy);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header usuario={usuario} />

      <main style={page}>
        <button style={backButton} onClick={() => navigate(-1)}>
          ← Volver
        </button>

        <section style={heroCard}>
          <div style={imageBox}>
            {cancha.imagen_principal ? (
              <img
                src={cancha.imagen_principal}
                alt={cancha.nombre}
                style={mainImage}
              />
            ) : (
              <span>Sin imagen principal</span>
            )}
          </div>

          <div>
            <p style={tag}>INFORMACIÓN DE LA CANCHA</p>
            <h1 style={title}>{cancha.nombre}</h1>
            <p style={subtitle}>{cancha.tipo}</p>

            <p>
              <strong>Ubicación:</strong> {cancha.ubicacion}
            </p>

            <p>
              <strong>Superficie:</strong>{" "}
              {cancha.superficie || "No registrada"}
            </p>

            <p>
              <strong>Distancia:</strong>{" "}
              {cancha.distancia || "No registrada"}
            </p>

            <p>
              <strong>Precio por hora:</strong>{" "}
              ${Number(cancha.precio_hora || 0).toLocaleString("es-CO")}
            </p>

            <p>
              <strong>Estado:</strong> {cancha.estado}
            </p>

            <p>
              <strong>Disponible hoy:</strong> {disponibleHoy ? "Sí" : "No"}
            </p>

            <p>
              <strong>Rating:</strong> ⭐ {cancha.rating || 0} / 5
            </p>

            <p>
              <strong>Total reseñas:</strong> {cancha.total_resenas || 0}
            </p>
          </div>
        </section>

        <section style={card}>
          <h2>Espacios abiertos</h2>

          <form style={openSlotFormStyle} onSubmit={crearEspacioAbierto}>
            <label style={formLabel}>
              Fecha
              <input
                type="date"
                required
                min={new Date().toISOString().split("T")[0]}
                value={openSlotForm.fecha}
                onChange={(e) =>
                  setOpenSlotForm({ ...openSlotForm, fecha: e.target.value })
                }
                style={formInput}
              />
            </label>

            <label style={formLabel}>
              Hora
              <select
                required
                value={openSlotForm.hora}
                onChange={(e) =>
                  setOpenSlotForm({ ...openSlotForm, hora: e.target.value })
                }
                style={formInput}
              >
                <option value="">Selecciona un horario</option>
                {HORARIOS_SELECT.map((label) => {
                  const value = label.match(/\d{2}:\d{2}/)?.[0] || label;

                  return (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </label>

            <label style={formLabel}>
              Duracion
              <select
                value={openSlotForm.duracion}
                onChange={(e) =>
                  setOpenSlotForm({
                    ...openSlotForm,
                    duracion: Number(e.target.value),
                  })
                }
                style={formInput}
              >
                <option value={1}>1 hora</option>
                <option value={2}>2 horas</option>
                <option value={3}>3 horas</option>
              </select>
            </label>

            <label style={formLabel}>
              Participantes
              <input
                type="number"
                min={2}
                max={30}
                required
                value={openSlotForm.participantes}
                onChange={(e) =>
                  setOpenSlotForm({
                    ...openSlotForm,
                    participantes: Number(e.target.value),
                  })
                }
                style={formInput}
              />
            </label>

            <button type="submit" style={primaryButton} disabled={creandoOpenSlot}>
              {creandoOpenSlot ? "Creando..." : "Crear espacio abierto"}
            </button>
          </form>

          {openSlotMessage && (
            <p style={{ color: "#008a00", fontWeight: 800, marginTop: 12 }}>
              {openSlotMessage}
            </p>
          )}
        </section>

        <section style={card}>
          <h2>Descripción</h2>

          {descripcion.length > 0 ? (
            <ul>
              {descripcion.map((item, index) => (
                <li key={index}>{String(item)}</li>
              ))}
            </ul>
          ) : (
            <p>No hay descripción registrada.</p>
          )}
        </section>

        <section style={card}>
          <h2>Características</h2>

          {caracteristicas.length > 0 ? (
            <div style={chips}>
              {caracteristicas.map((item, index) => (
                <span key={index} style={chip}>
                  {String(item)}
                </span>
              ))}
            </div>
          ) : (
            <p>No hay características registradas.</p>
          )}
        </section>

        <section style={card}>
          <h2>Imágenes secundarias</h2>

          {imagenes.length > 0 ? (
            <div style={imageGrid}>
              {imagenes.map((img, index) => (
                <img
                  key={index}
                  src={String(img)}
                  alt={`Imagen secundaria ${index + 1}`}
                  style={secondaryImage}
                />
              ))}
            </div>
          ) : (
            <p>No hay imágenes secundarias registradas.</p>
          )}
        </section>

        <section style={card}>
          <h2>Comentarios de usuarios</h2>

          {resenas.length > 0 ? (
            <div style={{ display: "grid", gap: 14 }}>
              {resenas.map((resena: Resena, index: number) => (
                <article key={index} style={reviewCard}>
                  <div style={reviewHeader}>
                    {getReviewPhoto(resena) ? (
                      <img
                        src={getReviewPhoto(resena)}
                        alt={resena.nombre || "Usuario"}
                        style={avatarImage}
                      />
                    ) : (
                      <div style={avatar}>{getReviewInitials(resena)}</div>
                    )}

                    <div>
                      <strong>{resena.nombre || "Usuario"}</strong>

                      <p style={{ margin: 0, color: "#6e8f6e" }}>
                        {resena.fecha || "Sin fecha"}
                      </p>
                    </div>
                  </div>

                  <p style={{ color: "#f1a600", fontSize: 18 }}>
                    {"★".repeat(Number(resena.estrellas || 0))}
                    {"☆".repeat(5 - Number(resena.estrellas || 0))}
                  </p>

                  <p>{resena.texto || "Sin comentario."}</p>
                </article>
              ))}
            </div>
          ) : (
            <p>Esta cancha todavía no tiene comentarios.</p>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

const page: React.CSSProperties = {
  flex: 1,
  maxWidth: 1200,
  width: "100%",
  margin: "0 auto",
  padding: "30px 40px 60px",
  color: "#0e260e",
};

const backButton: React.CSSProperties = {
  border: "2px solid rgba(0,171,0,0.18)",
  background: "white",
  color: "#00ab00",
  fontWeight: 700,
  padding: "10px 18px",
  borderRadius: 9,
  cursor: "pointer",
  marginBottom: 30,
};

const heroCard: React.CSSProperties = {
  background: "white",
  borderRadius: 18,
  padding: 22,
  display: "grid",
  gridTemplateColumns: "minmax(260px, 420px) 1fr",
  gap: 24,
  border: "1.5px solid rgba(0,171,0,0.18)",
  marginBottom: 18,
};

const imageBox: React.CSSProperties = {
  width: "100%",
  height: 320,
  background: "#edf7ed",
  borderRadius: 16,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#6e8f6e",
  fontWeight: 800,
  overflow: "hidden",
};

const mainImage: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const tag: React.CSSProperties = {
  color: "#00ab00",
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: 1.5,
};

const title: React.CSSProperties = {
  fontFamily: "'Bebas Neue', sans-serif",
  fontSize: 48,
  margin: "8px 0",
  color: "#0e260e",
};

const subtitle: React.CSSProperties = {
  color: "#008a00",
  fontWeight: 800,
};

const card: React.CSSProperties = {
  background: "white",
  borderRadius: 18,
  padding: 22,
  border: "1.5px solid rgba(0,171,0,0.18)",
  marginBottom: 18,
};

const openSlotFormStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 12,
  alignItems: "end",
};

const formLabel: React.CSSProperties = {
  color: "#0e260e",
  display: "grid",
  fontSize: 13,
  fontWeight: 800,
  gap: 6,
};

const formInput: React.CSSProperties = {
  width: "100%",
  marginTop: 6,
  border: "1.5px solid rgba(0,171,0,0.18)",
  borderRadius: 9,
  background: "#edf7ed",
  color: "#0e260e",
  fontFamily: "'Outfit', sans-serif",
  fontWeight: 700,
  outline: "none",
  padding: "11px 12px",
};

const primaryButton: React.CSSProperties = {
  background: "#00ab00",
  color: "white",
  border: "none",
  borderRadius: 9,
  padding: "13px 18px",
  fontWeight: 800,
  cursor: "pointer",
};

const chips: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
};

const chip: React.CSSProperties = {
  background: "#edf7ed",
  color: "#008a00",
  padding: "8px 12px",
  borderRadius: 999,
  fontWeight: 800,
};

const imageGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 12,
};

const secondaryImage: React.CSSProperties = {
  width: "100%",
  height: 160,
  objectFit: "cover",
  borderRadius: 12,
  border: "1px solid rgba(0,171,0,0.18)",
};

const reviewCard: React.CSSProperties = {
  background: "#edf7ed",
  borderRadius: 14,
  padding: 16,
};

const reviewHeader: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const avatar: React.CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: "50%",
  background: "#00ab00",
  color: "white",
  display: "grid",
  placeItems: "center",
  fontWeight: 900,
};

const avatarImage: React.CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: "50%",
  objectFit: "cover",
  border: "2px solid white",
};
