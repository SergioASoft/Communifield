import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Usuario } from "../types";

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
  estado: string;
}

interface SuscripcionGestor {
  estado: "sin_suscripcion" | "activa" | "vencida" | "cancelada";
  suscrito: boolean;
  id_suscripcion: number | null;
  plan: string | null;
  precio: number;
  fecha_inicio: string | null;
  fecha_fin: string | null;
}

const formInicial = {
  nombre: "",
  tipo: "",
  ubicacion: "",
  distancia: "",
  superficie: "",
  descripcion: "",
  caracteristicas: "",
  precio_hora: 0,
  imagen_principal: "",
  imagenes: "[]",
  disponible_hoy: true,
  estado: "activo",
};

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

function parseJson(value: any, fallback: string[] = []): string[] {
  if (!value) return fallback;
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value !== "string") return fallback;

  const cleanValue = value.trim();
  if (!cleanValue) return fallback;

  try {
    const parsed = JSON.parse(cleanValue);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : fallback;
  } catch {
    if (
      cleanValue.startsWith("data:image") ||
      cleanValue.startsWith("http://") ||
      cleanValue.startsWith("https://") ||
      cleanValue.startsWith("/uploads/")
    ) {
      return [cleanValue];
    }

    return fallback;
  }
}

function imagesToJson(images: string[]) {
  return JSON.stringify(images.filter(Boolean));
}

function textToList(value: string): string[] {
  return value
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
}

function getImageSrc(value: any): string {
  if (!value) return "";

  if (typeof value === "string") {
    const cleanValue = value.trim();

    if (!cleanValue) return "";
    if (cleanValue.startsWith("data:image")) return cleanValue;
    if (cleanValue.startsWith("http://")) return cleanValue;
    if (cleanValue.startsWith("https://")) return cleanValue;
    if (cleanValue.startsWith("/uploads/")) return cleanValue;
  }

  const imagenes = parseJson(value, []);
  return imagenes.length > 0 ? String(imagenes[0]) : "";
}

export default function GestionMisCanchasPage() {
  const navigate = useNavigate();
  const user = getUser();
  const userId = user?.id_usuario || user?.id || user?.user_id;

  const [usuario] = useState<Usuario | undefined>(getUsuarioHeader());
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [canchaActiva, setCanchaActiva] = useState<Cancha | null>(null);
  const [form, setForm] = useState(formInicial);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [suscripcion, setSuscripcion] =
    useState<SuscripcionGestor | null>(null);
  const [cargandoSuscripcion, setCargandoSuscripcion] = useState(true);
  const [pagandoSuscripcion, setPagandoSuscripcion] = useState(false);

  async function cargarMisCanchas() {
    try {
      setCargando(true);
      setError("");

      const res = await fetch(`/api/canchas/gestor/${userId}`);

      if (!res.ok) {
        throw new Error("No se pudieron cargar tus canchas");
      }

      const data = await res.json();
      setCanchas(data);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar tus canchas.");
    } finally {
      setCargando(false);
    }
  }

  async function cargarSuscripcion() {
    try {
      setCargandoSuscripcion(true);

      const res = await fetch(`/api/suscripciones/gestor/${userId}`);

      if (!res.ok) {
        throw new Error("No se pudo consultar la suscripción");
      }

      const data = await res.json();
      setSuscripcion(data);
    } catch (err) {
      console.error(err);
      setSuscripcion(null);
    } finally {
      setCargandoSuscripcion(false);
    }
  }

  async function confirmarPagoStripe(sessionId: string) {
    try {
      const res = await fetch("/api/suscripciones/confirmar-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "No se pudo confirmar el pago");
      }

      await cargarSuscripcion();
      window.history.replaceState({}, "", "/gestion/mis-canchas");
    } catch (err) {
      console.error(err);
      setError(
        "El pago se realizó, pero no se pudo confirmar la suscripción. Recarga la página o revisa Stripe."
      );
    }
  }

  async function iniciarSuscripcion() {
    try {
      setPagandoSuscripcion(true);
      setError("");

      const res = await fetch("/api/suscripciones/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ gestorId: userId }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.detail || data.message || "No se pudo iniciar el pago");
      }

      if (!data.url) {
        throw new Error("Stripe no devolvió la URL de pago");
      }

      window.location.href = data.url;
    } catch (err: any) {
      console.error(err);
      setError(err.message || "No se pudo iniciar la suscripción.");
    } finally {
      setPagandoSuscripcion(false);
    }
  }

  useEffect(() => {
    if (userId) {
      cargarMisCanchas();
      cargarSuscripcion();
    }
  }, [userId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("stripe_session_id");

    if (userId && sessionId) {
      confirmarPagoStripe(sessionId);
    }
  }, [userId]);

  const canchasFiltradas = useMemo(() => {
    const term = busqueda.toLowerCase().trim();

    if (!term) return canchas;

    return canchas.filter((cancha) =>
      [
        cancha.nombre,
        cancha.tipo,
        cancha.ubicacion,
        cancha.superficie || "",
        cancha.estado,
      ].some((campo) => campo.toLowerCase().includes(term))
    );
  }, [busqueda, canchas]);

  function abrirNuevaCancha() {
    setCanchaActiva(null);
    setForm(formInicial);
  }

  function abrirEditar(cancha: Cancha) {
    const descripcion = parseJson(cancha.descripcion, []);
    const imagenes = parseJson(cancha.imagenes, []);
    const caracteristicas = parseJson(cancha.caracteristicas, []);

    setCanchaActiva(cancha);

    setForm({
      nombre: cancha.nombre || "",
      tipo: cancha.tipo || "",
      ubicacion: cancha.ubicacion || "",
      distancia: cancha.distancia || "",
      superficie: cancha.superficie || "",
      descripcion: descripcion.join("\n"),
      caracteristicas: caracteristicas.join("\n"),
      precio_hora: Number(cancha.precio_hora || 0),
      imagen_principal: cancha.imagen_principal || "",
      imagenes: imagesToJson(imagenes),
      disponible_hoy: Boolean(cancha.disponible_hoy),
      estado: cancha.estado || "activo",
    });
  }

  async function guardarCancha(e: React.FormEvent) {
    e.preventDefault();

    const payload = {
      fk_id_dueño: userId,
      nombre: form.nombre,
      tipo: form.tipo,
      ubicacion: form.ubicacion,
      distancia: form.distancia || null,
      superficie: form.superficie || null,
      descripcion: textToList(form.descripcion),
      caracteristicas: textToList(form.caracteristicas),
      precio_hora: Number(form.precio_hora),
      rating: canchaActiva?.rating || 0,
      total_resenas: canchaActiva?.total_resenas || 0,
      disponible_hoy: form.disponible_hoy,
      imagen_principal: form.imagen_principal || null,
      imagenes: parseJson(form.imagenes),
      estado: form.estado,
    };

    const url = canchaActiva
      ? `/api/canchas/${canchaActiva.id_espacio}`
      : "/api/canchas";

    const method = canchaActiva ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      alert("No se pudo guardar la cancha");
      return;
    }

    await cargarMisCanchas();
    abrirNuevaCancha();
  }

  async function borrarCancha(cancha: Cancha) {
    const confirmar = window.confirm(
      `¿Seguro que quieres borrar la cancha "${cancha.nombre}"?`
    );

    if (!confirmar) return;

    const res = await fetch(`/api/canchas/${cancha.id_espacio}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      alert("No se pudo borrar la cancha");
      return;
    }

    await cargarMisCanchas();

    if (canchaActiva?.id_espacio === cancha.id_espacio) {
      abrirNuevaCancha();
    }
  }

  if (!userId) {
    return <p>No hay usuario en sesión.</p>;
  }

  const imagenesSecundariasPreview = parseJson(form.imagenes);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header usuario={usuario} />

      <main
        style={{
          flex: 1,
          maxWidth: 1200,
          width: "100%",
          margin: "0 auto",
          padding: "30px 40px 60px",
        }}
      >
        <button type="button" onClick={() => window.history.back()} style={backButton}>
          ← Retroceder
        </button>

        <section style={{ marginBottom: 30 }}>
          <p style={{ color: "#65c25d", fontWeight: 800, letterSpacing: 2 }}>
            PANEL DEL GESTOR
          </p>

          <h1 style={titleStyle}>
            Gestión de <span style={{ color: "#00ab00" }}>mis canchas</span>
          </h1>

          <p style={{ color: "#6e8f6e", fontWeight: 600 }}>
            Aquí solo aparecen las canchas creadas por tu usuario gestor.
          </p>
        </section>

        <section style={suscripcionPanelStyle}>
          <div>
            <p style={formTag}>SUSCRIPCIÓN DEL GESTOR</p>

            <h2 style={{ margin: "4px 0", color: "#0e260e" }}>
              {cargandoSuscripcion
                ? "Consultando suscripción..."
                : suscripcion?.suscrito
                ? "Tu suscripción está activa"
                : "Tus canchas aún no aparecen al público"}
            </h2>

            <p style={{ margin: 0, color: "#547654", fontWeight: 700 }}>
              {suscripcion?.suscrito
                ? `Plan ${
                    suscripcion.plan || "mensual"
                  }. Tus canchas activas ya pueden recibir reservas.`
                : "Puedes crear y administrar canchas, pero solo se mostrarán en la plataforma cuando tengas una suscripción activa."}
            </p>

            {suscripcion?.fecha_fin && (
              <p style={{ margin: "8px 0 0", color: "#6e8f6e", fontWeight: 700 }}>
                Vence:{" "}
                {new Date(suscripcion.fecha_fin).toLocaleDateString("es-CO")}
              </p>
            )}
          </div>

          {!suscripcion?.suscrito && (
            <button
              type="button"
              onClick={iniciarSuscripcion}
              disabled={pagandoSuscripcion || cargandoSuscripcion}
              style={{
                ...primaryButton,
                opacity: pagandoSuscripcion || cargandoSuscripcion ? 0.65 : 1,
              }}
            >
              {pagandoSuscripcion ? "Abriendo Stripe..." : "Suscribirme"}
            </button>
          )}
        </section>

        <section style={searchPanel}>
          <input
            type="search"
            placeholder="Buscar mis canchas por nombre, tipo, ubicación, superficie o estado..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={inputStyle}
          />
        </section>

        {error && <p style={{ color: "#c0392b", fontWeight: 700 }}>{error}</p>}

        <section style={layoutStyle}>
          <div style={listStyle}>
            {cargando && <p>Cargando tus canchas...</p>}

            {!cargando && canchasFiltradas.length === 0 && (
              <p>No tienes canchas registradas o no hay resultados.</p>
            )}

            {canchasFiltradas.map((cancha) => (
              <article
                key={cancha.id_espacio}
                onClick={() => navigate(`/gestion/mis-canchas/${cancha.id_espacio}`)}
                style={{
                  ...cardStyle,
                  border:
                    canchaActiva?.id_espacio === cancha.id_espacio
                      ? "2px solid #00ab00"
                      : "1.5px solid rgba(0,171,0,0.18)",
                }}
              >
                <div style={imageBox}>
                  {getImageSrc(cancha.imagen_principal || cancha.imagenes) ? (
                    <img
                      src={getImageSrc(cancha.imagen_principal || cancha.imagenes)}
                      alt={cancha.nombre}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <span>Sin imagen</span>
                  )}
                </div>

                <div style={{ padding: 14 }}>
                  <h3>{cancha.nombre}</h3>
                  <p>{cancha.ubicacion}</p>

                  <strong>
                    ${Number(cancha.precio_hora || 0).toLocaleString("es-CO")} / hora
                  </strong>

                  <p style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>
                    Estado: {cancha.estado}
                  </p>

                  <p style={{ fontSize: 12, fontWeight: 800, marginBottom: 10 }}>
                    Disponible hoy:{" "}
                    {cancha.estado === "activo" && Boolean(cancha.disponible_hoy)
                      ? "Sí"
                      : "No"}
                  </p>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      abrirEditar(cancha);
                    }}
                    style={editButton}
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      borrarCancha(cancha);
                    }}
                    style={deleteButton}
                  >
                    Borrar
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div style={rightColumnStyle}>
            {canchaActiva && (
              <section style={infoCanchaStyle}>
                <h2 style={{ marginTop: 0, color: "#0e260e" }}>
                  Información de la cancha
                </h2>

                {canchaActiva.imagen_principal && (
                  <img
                    src={canchaActiva.imagen_principal}
                    alt={canchaActiva.nombre}
                    style={{
                      width: "100%",
                      height: 220,
                      objectFit: "cover",
                      borderRadius: 14,
                      marginBottom: 14,
                    }}
                  />
                )}

                <p>
                  <strong>Nombre:</strong> {canchaActiva.nombre}
                </p>
                <p>
                  <strong>Tipo:</strong> {canchaActiva.tipo}
                </p>
                <p>
                  <strong>Ubicación:</strong> {canchaActiva.ubicacion}
                </p>
                <p>
                  <strong>Distancia:</strong>{" "}
                  {canchaActiva.distancia || "No registrada"}
                </p>
                <p>
                  <strong>Superficie:</strong>{" "}
                  {canchaActiva.superficie || "No registrada"}
                </p>
                <p>
                  <strong>Precio:</strong>{" "}
                  ${Number(canchaActiva.precio_hora || 0).toLocaleString("es-CO")}{" "}
                  / hora
                </p>
                <p>
                  <strong>Rating:</strong> {canchaActiva.rating || 0}
                </p>
                <p>
                  <strong>Total reseñas:</strong> {canchaActiva.total_resenas || 0}
                </p>
                <p>
                  <strong>Disponible hoy:</strong>{" "}
                  {canchaActiva.estado === "activo" &&
                  Boolean(canchaActiva.disponible_hoy)
                    ? "Sí"
                    : "No"}
                </p>
                <p>
                  <strong>Estado:</strong> {canchaActiva.estado}
                </p>
              </section>
            )}

            <form onSubmit={guardarCancha} style={formStyle}>
              <div>
                <p style={formTag}>FORMULARIO</p>
                <h2 style={{ margin: 0 }}>
                  {canchaActiva ? "Editar cancha" : "Crear nueva cancha"}
                </h2>
              </div>

              <div style={formGridTwo}>
                <label>
                  Nombre
                  <input
                    required
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    style={formInput}
                  />
                </label>

                <label>
                  Tipo
                  <select
                    required
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                    style={formInput}
                  >
                    <option value="">Seleccione un tipo</option>
                    <option value="Fútbol 5">Fútbol 5</option>
                    <option value="Fútbol 7">Fútbol 7</option>
                    <option value="Fútbol 11">Fútbol 11</option>
                  </select>
                </label>
              </div>

              <label>
                Ubicación
                <input
                  required
                  value={form.ubicacion}
                  onChange={(e) => setForm({ ...form, ubicacion: e.target.value })}
                  style={formInput}
                />
              </label>

              <div style={formGridTwo}>
                <label>
                  Distancia
                  <input
                    value={form.distancia}
                    onChange={(e) => setForm({ ...form, distancia: e.target.value })}
                    style={formInput}
                  />
                </label>

                <label>
                  Superficie
                  <input
                    value={form.superficie}
                    onChange={(e) => setForm({ ...form, superficie: e.target.value })}
                    style={formInput}
                  />
                </label>
              </div>

              <div style={formGridTwo}>
                <label>
                  Precio por hora
                  <input
                    type="number"
                    min={0}
                    value={form.precio_hora}
                    onChange={(e) =>
                      setForm({ ...form, precio_hora: Number(e.target.value) })
                    }
                    style={formInput}
                  />
                </label>

                <label>
                  Estado
                  <select
                    value={form.estado}
                    onChange={(e) => setForm({ ...form, estado: e.target.value })}
                    style={formInput}
                  >
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                    <option value="mantenimiento">Mantenimiento</option>
                  </select>
                </label>
              </div>

              <label>
                Imagen principal
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    const imagen = await fileToDataUrl(file);

                    setForm({
                      ...form,
                      imagen_principal: imagen,
                    });

                    e.target.value = "";
                  }}
                  style={formInput}
                />
              </label>

              {form.imagen_principal && (
                <img
                  src={form.imagen_principal}
                  alt="Vista previa"
                  style={{
                    width: "100%",
                    height: 180,
                    objectFit: "cover",
                    borderRadius: 12,
                    border: "1.5px solid rgba(0,171,0,0.18)",
                  }}
                />
              )}

              <label>
                Imágenes secundarias
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length === 0) return;

                    const nuevasImagenes = await Promise.all(
                      files.map((file) => fileToDataUrl(file))
                    );

                    const imagenesActuales = parseJson(form.imagenes);

                    setForm({
                      ...form,
                      imagenes: imagesToJson([...imagenesActuales, ...nuevasImagenes]),
                    });

                    e.target.value = "";
                  }}
                  style={formInput}
                />
              </label>

              {imagenesSecundariasPreview.length > 0 && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                    gap: 10,
                    marginTop: 10,
                  }}
                >
                  {imagenesSecundariasPreview.map((img: string, index: number) => (
                    <img
                      key={`${img}-${index}`}
                      src={img}
                      alt={`Imagen secundaria ${index + 1}`}
                      style={{
                        width: "100%",
                        height: 110,
                        objectFit: "cover",
                        borderRadius: 10,
                        border: "1px solid rgba(0,171,0,0.18)",
                      }}
                    />
                  ))}
                </div>
              )}

              <label>
                Descripción
                <textarea
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Párrafo"
                  style={textareaStyle}
                />
              </label>

              <label>
                Características
                <textarea
                  value={form.caracteristicas}
                  onChange={(e) =>
                    setForm({ ...form, caracteristicas: e.target.value })
                  }
                  placeholder="Una característica por línea. Ej: Parqueadero, Baños, Iluminación"
                  style={textareaStyle}
                />
              </label>

              <label style={checkRow}>
                <input
                  type="checkbox"
                  checked={form.disponible_hoy}
                  onChange={(e) =>
                    setForm({ ...form, disponible_hoy: e.target.checked })
                  }
                />
                Disponible hoy
              </label>

              <button type="submit" style={primaryButton}>
                {canchaActiva ? "Guardar cambios" : "Crear cancha"}
              </button>
            </form>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

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

const titleStyle: React.CSSProperties = {
  fontFamily: "'Bebas Neue', sans-serif",
  fontSize: 56,
  letterSpacing: 2,
  margin: "10px 0",
  color: "#0e260e",
};

const suscripcionPanelStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 18,
  flexWrap: "wrap",
  background: "#edf7ed",
  border: "1.5px solid rgba(0,171,0,0.18)",
  padding: 18,
  borderRadius: 16,
  marginBottom: 20,
};

const searchPanel: React.CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  background: "white",
  border: "1.5px solid rgba(0,171,0,0.18)",
  padding: 14,
  borderRadius: 14,
  marginBottom: 24,
};

const inputStyle: React.CSSProperties = {
  flex: "1 1 300px",
  border: "none",
  background: "#edf7ed",
  padding: "13px 14px",
  borderRadius: 9,
  outline: "none",
};

const primaryButton: React.CSSProperties = {
  background: "#00ab00",
  color: "white",
  border: "none",
  borderRadius: 9,
  padding: "13px 22px",
  fontWeight: 800,
  cursor: "pointer",
};

const editButton: React.CSSProperties = {
  ...primaryButton,
  width: "100%",
  marginTop: 4,
};

const deleteButton: React.CSSProperties = {
  background: "#c0392b",
  color: "white",
  border: "none",
  borderRadius: 9,
  padding: "13px 22px",
  fontWeight: 800,
  cursor: "pointer",
  width: "100%",
  marginTop: 10,
};

const layoutStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 420px",
  gap: 24,
  alignItems: "start",
};

const listStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
  gap: 18,
};

const cardStyle: React.CSSProperties = {
  background: "white",
  borderRadius: 16,
  overflow: "hidden",
  cursor: "pointer",
  boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
};

const imageBox: React.CSSProperties = {
  height: 150,
  background: "#edf7ed",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#6e8f6e",
  fontWeight: 800,
};

const rightColumnStyle: React.CSSProperties = {
  display: "grid",
  gap: 18,
  alignSelf: "start",
};

const infoCanchaStyle: React.CSSProperties = {
  background: "#edf7ed",
  border: "1.5px solid rgba(0,171,0,0.18)",
  borderRadius: 16,
  padding: 18,
};

const formStyle: React.CSSProperties = {
  background: "white",
  border: "1.5px solid rgba(0,171,0,0.18)",
  borderRadius: 16,
  padding: 22,
  display: "grid",
  gap: 12,
};

const formInput: React.CSSProperties = {
  width: "100%",
  marginTop: 6,
  border: "1.5px solid rgba(0,171,0,0.18)",
  borderRadius: 9,
  padding: "11px 12px",
};

const textareaStyle: React.CSSProperties = {
  ...formInput,
  minHeight: 90,
  resize: "vertical",
};

const formTag: React.CSSProperties = {
  margin: "0 0 6px",
  color: "#00ab00",
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: 1.5,
};

const formGridTwo: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12,
};

const checkRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  fontWeight: 800,
  color: "#0e260e",
};