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

function parseJsonField(value: any, fallback: any[] = []) {
  if (!value) return fallback;

  if (Array.isArray(value)) {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
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

function getInitials(name: string) {
  return name
    .trim()
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function Galeria({ cancha }: GaleriaProps) {
  const [miniActiva, setMiniActiva] = useState(0);

  const imagenPrincipal =
    cancha.imagenes?.[miniActiva] ||
    cancha.imagen_principal ||
    "";

  return (
    <section className="galeria">
      <div className="galeria-principal">
        {imagenPrincipal ? (
          <img
            src={imagenPrincipal}
            alt={cancha.nombre}
            onError={(e) => {
              const el = e.currentTarget.parentElement!;

              el.innerHTML = `
                <div class="galeria-placeholder">
                  <p>Sin imagen disponible</p>
                </div>
              `;
            }}
          />
        ) : (
          <div className="galeria-placeholder">
            <p>Sin imagen disponible</p>
          </div>
        )}
      </div>

      {cancha.imagenes?.length > 0 && (
        <div className="galeria-miniaturas">
          {cancha.imagenes.map((img: string, i: number) => (
            <div
              key={i}
              className={`miniatura${
                miniActiva === i ? " active" : ""
              }`}
              onClick={() => setMiniActiva(i)}
            >
              <img
                src={img}
                alt={`Vista ${i + 1}`}
              />
            </div>
          ))}

          <div className="miniatura miniatura-mas">
            <span>+ fotos</span>
          </div>
        </div>
      )}
    </section>
  );
}

function Estrellas({ valor }: { valor: number }) {
  return (
    <>
      {"★".repeat(Math.floor(valor))}
      {"☆".repeat(5 - Math.floor(valor))}
    </>
  );
}

export default function CanchaPage() {
  const { id } = useParams();

  const [cancha, setCancha] = useState<any>(null);

  const [usuario, setUsuario] = useState<
    Usuario | undefined
  >(undefined);

  useEffect(() => {
    setUsuario(getUsuarioSesion());
  }, []);

  useEffect(() => {
    fetch(`/api/canchas/${id}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(
            "No se pudo cargar la cancha"
          );
        }

        return res.json();
      })
      .then((data) => {
        setCancha({
          ...data,

          descripcion: parseJsonField(
            data.descripcion
          ),

          imagenes: parseJsonField(
            data.imagenes
          ),

          caracteristicas: parseJsonField(
            data.caracteristicas
          ),

          horarios: parseJsonField(
            data.horarios
          ),

          resenas: parseJsonField(
            data.resenas
          ),

          disponible_hoy: Boolean(
            data.disponible_hoy
          ),
        });
      })
      .catch((error) => {
        console.error(error);
      });
  }, [id]);

  if (!cancha) {
    return <p>Cargando...</p>;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
      }}
    >
      <Header usuario={usuario} />

      <main className="cancha-main">
        <button
          className="back-button cancha-back-button"
          type="button"
          onClick={() =>
            window.history.back()
          }
        >
          ← Retroceder
        </button>

        <nav className="breadcrumb">
          <a href="/">Inicio</a>

          <span>›</span>

          <a href="/canchas">Canchas</a>

          <span>›</span>

          <span className="breadcrumb-active">
            {cancha.nombre}
          </span>
        </nav>

        <Galeria cancha={cancha} />

        <div className="cancha-layout">
          <div className="cancha-info">
            <div className="cancha-header">
              <div>
                <div className="cancha-badges">
                  <span className="badge badge-tipo">
                    {cancha.tipo}
                  </span>

                  {cancha.disponible_hoy && (
                    <span className="badge badge-disponible">
                      Disponible hoy
                    </span>
                  )}
                </div>

                <h1 className="cancha-nombre">
                  {cancha.nombre}
                </h1>

                <p className="cancha-ubicacion">
                  {cancha.ubicacion}

                  {cancha.distancia &&
                    ` · A ${cancha.distancia}`}
                </p>
              </div>

              <div className="cancha-rating">
                <span className="rating-numero">
                  {cancha.rating || 0}
                </span>

                <div className="rating-estrellas">
                  <Estrellas
                    valor={Number(
                      cancha.rating || 0
                    )}
                  />
                </div>

                <span className="rating-reviews">
                  {cancha.total_resenas || 0} reseñas
                </span>
              </div>
            </div>

            <div className="seccion">
              <h2 className="seccion-titulo">
                Descripción
              </h2>

              {(cancha.descripcion || []).map(
                (
                  parrafo: string,
                  i: number
                ) => (
                  <p
                    key={i}
                    className="cancha-desc"
                  >
                    {parrafo}
                  </p>
                )
              )}
            </div>

            <div className="seccion">
              <h2 className="seccion-titulo">
                Características
              </h2>

              <div className="caracteristicas-grid">
                {(cancha.caracteristicas || []).map(
                  (
                    c: any,
                    index: number
                  ) => (
                    <div
                      key={index}
                      className="caract-item"
                    >
                      <div>
                        <p className="caract-label">
                          {c.label}
                        </p>

                        <p className="caract-valor">
                          {c.valor}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="seccion">
              <h2 className="seccion-titulo">
                Horarios disponibles
              </h2>

              <div className="horarios-semana">
                {(cancha.horarios || []).map(
                  (
                    h: any,
                    index: number
                  ) => (
                    <div
                      key={index}
                      className={`dia-item${
                        h.esFinde
                          ? " dia-finde"
                          : ""
                      }`}
                    >
                      <span className="dia-nombre">
                        {h.dia}
                      </span>

                      <span className="dia-horas">
                        {h.horas}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="seccion">
              <h2 className="seccion-titulo">
                Reseñas

                <span className="reseñas-count">
                  ({cancha.total_resenas || 0})
                </span>
              </h2>

              <div className="reseñas-lista">
                {(cancha.resenas || []).map(
                  (
                    r: any,
                    index: number
                  ) => (
                    <div
                      key={index}
                      className="reseña-card"
                    >
                      <div className="reseña-header">
                        <div className="reseña-avatar">
                          {r.iniciales}
                        </div>

                        <div>
                          <p className="reseña-nombre">
                            {r.nombre}
                          </p>

                          <p className="reseña-fecha">
                            {r.fecha}
                          </p>
                        </div>

                        <div className="reseña-stars">
                          <Estrellas
                            valor={
                              r.estrellas || 0
                            }
                          />
                        </div>
                      </div>

                      <p className="reseña-texto">
                        {r.texto}
                      </p>
                    </div>
                  )
                )}
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