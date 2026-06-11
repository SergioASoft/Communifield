import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import "../styles/CanchaPage.css";

import Header from "../components/Header";
import Footer from "../components/Footer";
import ReservaPanel from "../components/ReservaPanel";

import { Usuario } from "../types";

interface GaleriaProps {
  cancha: any;
}

function parseJsonField(value: any, fallback: any[] = []): any[] {
  if (!value) return fallback;

  if (Array.isArray(value)) return value.filter(Boolean);

  if (typeof value !== "string") return fallback;

  const cleanValue = value.trim();
  if (!cleanValue) return fallback;

  try {
    const parsed = JSON.parse(cleanValue);

    if (Array.isArray(parsed)) return parsed.filter(Boolean);

    if (typeof parsed === "string" && parsed.trim()) {
      return [parsed.trim()];
    }

    return fallback;
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

function getImagenesCancha(cancha: any): string[] {
  const principal = cancha.imagen_principal
    ? [String(cancha.imagen_principal).trim()]
    : [];

  const secundarias = parseJsonField(cancha.imagenes);

  return [...principal, ...secundarias]
    .filter(Boolean)
    .filter((img, index, array) => array.indexOf(img) === index);
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

function usuarioPuedeModificarResena(usuario: Usuario | undefined, resena: any) {
  if (!usuario) return false;

  return resena.email === usuario.email || resena.nombre === usuario.nombre;
}

function Galeria({ cancha }: GaleriaProps) {
  const [miniActiva, setMiniActiva] = useState(0);

  const imagenes = getImagenesCancha(cancha);
  const imagenPrincipal = imagenes[miniActiva] || "";

  useEffect(() => {
    setMiniActiva(0);
  }, [cancha?.id_espacio]);

  return (
    <section className="galeria">
      <div className="galeria-principal">
        {imagenPrincipal ? (
          <img src={imagenPrincipal} alt={cancha.nombre || "Cancha"} />
        ) : (
          <div className="galeria-placeholder">
            <p>Sin imagen disponible</p>
          </div>
        )}
      </div>

      {imagenes.length > 1 && (
        <div className="galeria-miniaturas">
          {imagenes.map((img: string, i: number) => (
            <button
              key={`${img}-${i}`}
              type="button"
              className={`miniatura${miniActiva === i ? " active" : ""}`}
              onClick={() => setMiniActiva(i)}
            >
              <img src={img} alt={`Vista ${i + 1}`} />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function Estrellas({ valor }: { valor: number }) {
  const rating = Math.max(0, Math.min(5, Math.floor(Number(valor) || 0)));

  return (
    <>
      {"★".repeat(rating)}
      {"☆".repeat(5 - rating)}
    </>
  );
}

export default function CanchaPage() {
  const { id } = useParams();

  const [cancha, setCancha] = useState<any>(null);
  const [estrellas, setEstrellas] = useState(5);
  const [textoResena, setTextoResena] = useState("");
  const [enviandoResena, setEnviandoResena] = useState(false);
  const [mensajeResena, setMensajeResena] = useState("");

  const [editandoIndex, setEditandoIndex] = useState<number | null>(null);
  const [textoEditado, setTextoEditado] = useState("");
  const [estrellasEditadas, setEstrellasEditadas] = useState(5);

  const [usuario, setUsuario] = useState<Usuario | undefined>(undefined);

  useEffect(() => {
    setUsuario(getUsuarioSesion());
  }, []);

  function formatearCancha(data: any) {
    return {
      ...data,
      descripcion: parseJsonField(data.descripcion),
      imagenes: parseJsonField(data.imagenes),
      caracteristicas: parseJsonField(data.caracteristicas),
      horarios: parseJsonField(data.horarios),
      resenas: parseJsonField(data.resenas),
      disponible_hoy: data.estado === "activo" && Boolean(data.disponible_hoy),
    };
  }

  async function cargarCancha() {
    try {
      const res = await fetch(`/api/canchas/${id}`);

      if (!res.ok) {
        throw new Error("No se pudo cargar la cancha");
      }

      const data = await res.json();
      setCancha(formatearCancha(data));
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    cargarCancha();
  }, [id]);

  async function enviarResena(e: React.FormEvent) {
    e.preventDefault();

    if (!usuario) {
      setMensajeResena("Debes iniciar sesión para dejar una reseña.");
      return;
    }

    if (!textoResena.trim()) {
      setMensajeResena("Escribe un comentario antes de enviar.");
      return;
    }

    setEnviandoResena(true);
    setMensajeResena("");

    try {
      const res = await fetch(`/api/canchas/${id}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: usuario.nombre,
          email: usuario.email,
          iniciales: usuario.iniciales,
          foto: usuario.avatarUrl,
          estrellas,
          texto: textoResena,
          fecha: new Date().toLocaleDateString("es-CO"),
        }),
      });

      if (!res.ok) {
        throw new Error("No se pudo guardar la reseña");
      }

      const data = await res.json();

      setCancha(formatearCancha(data));
      setTextoResena("");
      setEstrellas(5);
      setMensajeResena("Reseña publicada correctamente.");
    } catch {
      setMensajeResena("No se pudo publicar la reseña.");
    } finally {
      setEnviandoResena(false);
    }
  }

  function iniciarEdicion(index: number, resena: any) {
    setEditandoIndex(index);
    setTextoEditado(resena.texto || "");
    setEstrellasEditadas(Number(resena.estrellas || 5));
  }

  function cancelarEdicion() {
    setEditandoIndex(null);
    setTextoEditado("");
    setEstrellasEditadas(5);
  }

  async function guardarEdicion(index: number) {
    if (!textoEditado.trim()) {
      setMensajeResena("El comentario no puede quedar vacío.");
      return;
    }

    try {
      const res = await fetch(`/api/canchas/${id}/reviews/${index}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          texto: textoEditado,
          estrellas: estrellasEditadas,
          email: usuario?.email,
        }),
      });

      if (!res.ok) {
        throw new Error("No se pudo editar la reseña");
      }

      const data = await res.json();

      setCancha(formatearCancha(data));
      cancelarEdicion();
      setMensajeResena("Reseña editada correctamente.");
    } catch {
      setMensajeResena("No se pudo editar la reseña.");
    }
  }

  async function borrarResena(index: number) {
    const confirmar = window.confirm("¿Seguro que quieres borrar esta reseña?");
    if (!confirmar) return;

    try {
      const res = await fetch(`/api/canchas/${id}/reviews/${index}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: usuario?.email,
        }),
      });

      if (!res.ok) {
        throw new Error("No se pudo borrar la reseña");
      }

      const data = await res.json();

      setCancha(formatearCancha(data));
      setMensajeResena("Reseña eliminada correctamente.");
    } catch {
      setMensajeResena("No se pudo eliminar la reseña.");
    }
  }

  if (!cancha) {
    return <p>Cargando...</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header usuario={usuario} />

      <main className="cancha-main">
        <button
          className="back-button cancha-back-button"
          type="button"
          onClick={() => window.history.back()}
        >
          ← Retroceder
        </button>

        <nav className="breadcrumb">
          <a href="/">Inicio</a>
          <span>›</span>
          <a href="/canchas">Canchas</a>
          <span>›</span>
          <span className="breadcrumb-active">{cancha.nombre}</span>
        </nav>

        <Galeria cancha={cancha} />

        <div className="cancha-layout">
          <div className="cancha-info">
            <div className="cancha-header">
              <div>
                <div className="cancha-badges">
                  <span className="badge badge-tipo">{cancha.tipo}</span>

                  {cancha.estado === "activo" && cancha.disponible_hoy && (
                    <span className="badge badge-disponible">Disponible hoy</span>
                  )}
                </div>

                <h1 className="cancha-nombre">{cancha.nombre}</h1>

                <p className="cancha-ubicacion">
                  {cancha.ubicacion}
                  {cancha.distancia && ` · A ${cancha.distancia}`}
                </p>
              </div>

              <div className="cancha-rating">
                <span className="rating-numero">{cancha.rating || 0}</span>

                <div className="rating-estrellas">
                  <Estrellas valor={Number(cancha.rating || 0)} />
                </div>

                <span className="rating-reviews">
                  {cancha.total_resenas || 0} reseñas
                </span>
              </div>
            </div>

            <div className="seccion">
              <h2 className="seccion-titulo">Descripción</h2>

              {(cancha.descripcion || []).length > 0 ? (
                cancha.descripcion.map((parrafo: string, i: number) => (
                  <p key={i} className="cancha-desc">
                    {parrafo}
                  </p>
                ))
              ) : (
                <p className="cancha-desc">No hay descripción registrada.</p>
              )}
            </div>

            <div className="seccion">
              <h2 className="seccion-titulo">Características</h2>

              {(cancha.caracteristicas || []).length > 0 ? (
                cancha.caracteristicas.map((caracteristica: string, i: number) => (
                  <p key={i} className="cancha-desc">
                    {caracteristica}
                  </p>
                ))
              ) : (
                <p className="cancha-desc">No hay características registradas.</p>
              )}
            </div>

            <div className="seccion">
              <h2 className="seccion-titulo">
                Reseñas
                <span className="reseñas-count">
                  ({cancha.total_resenas || 0})
                </span>
              </h2>

              <form className="reseña-form" onSubmit={enviarResena}>
                <h3>Deja tu reseña</h3>

                <label>
                  Calificación
                  <select
                    value={estrellas}
                    onChange={(e) => setEstrellas(Number(e.target.value))}
                  >
                    <option value={5}>5 estrellas</option>
                    <option value={4}>4 estrellas</option>
                    <option value={3}>3 estrellas</option>
                    <option value={2}>2 estrellas</option>
                    <option value={1}>1 estrella</option>
                  </select>
                </label>

                <label>
                  Comentario
                  <textarea
                    value={textoResena}
                    onChange={(e) => setTextoResena(e.target.value)}
                    placeholder="Cuéntanos cómo fue tu experiencia..."
                    rows={4}
                  />
                </label>

                {mensajeResena && (
                  <p className="reseña-mensaje">{mensajeResena}</p>
                )}

                <button type="submit" disabled={enviandoResena}>
                  {enviandoResena ? "Publicando..." : "Publicar reseña"}
                </button>
              </form>

              <div className="reseñas-lista">
                {(cancha.resenas || []).map((r: any, index: number) => {
                  const puedeModificar = usuarioPuedeModificarResena(usuario, r);
                  const estaEditando = editandoIndex === index;

                  return (
                    <div key={index} className="reseña-card">
                      <div className="reseña-header">
                        {r.foto || r.avatarUrl || r.photo ? (
                          <img
                            src={r.foto || r.avatarUrl || r.photo}
                            alt={r.nombre || "Usuario"}
                            className="reseña-avatar-img"
                          />
                        ) : (
                          <div className="reseña-avatar">
                            {r.iniciales || getInitials(r.nombre || "Usuario")}
                          </div>
                        )}

                        <div>
                          <p className="reseña-nombre">{r.nombre}</p>
                          <p className="reseña-fecha">{r.fecha}</p>
                        </div>

                        <div className="reseña-stars">
                          <Estrellas valor={r.estrellas || 0} />
                        </div>
                      </div>

                      {estaEditando ? (
                        <div className="reseña-edit-form">
                          <label>
                            Calificación
                            <select
                              value={estrellasEditadas}
                              onChange={(e) =>
                                setEstrellasEditadas(Number(e.target.value))
                              }
                            >
                              <option value={5}>5 estrellas</option>
                              <option value={4}>4 estrellas</option>
                              <option value={3}>3 estrellas</option>
                              <option value={2}>2 estrellas</option>
                              <option value={1}>1 estrella</option>
                            </select>
                          </label>

                          <label>
                            Comentario
                            <textarea
                              value={textoEditado}
                              onChange={(e) => setTextoEditado(e.target.value)}
                              rows={3}
                            />
                          </label>

                          <div className="reseña-actions">
                            <button type="button" onClick={() => guardarEdicion(index)}>
                              Guardar
                            </button>

                            <button type="button" onClick={cancelarEdicion}>
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="reseña-texto">{r.texto}</p>

                          {puedeModificar && (
                            <div className="reseña-actions">
                              <button
                                type="button"
                                onClick={() => iniciarEdicion(index, r)}
                              >
                                Editar
                              </button>

                              <button type="button" onClick={() => borrarResena(index)}>
                                Borrar
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <ReservaPanel cancha={cancha} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
