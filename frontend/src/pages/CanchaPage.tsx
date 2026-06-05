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

  return (
    <section className="galeria">
      <div className="galeria-principal">
        <img
          src={cancha.imagen_principal}
          alt={cancha.nombre}
          onError={(e) => {
            const el = e.currentTarget.parentElement!;

            el.innerHTML = `
              <div class="galeria-placeholder">
                <span></span>
                <p>Foto principal</p>
              </div>
            `;
          }}
        />
      </div>

      <div className="galeria-miniaturas">
        {cancha.imagenes.map((img: string, i: number) => (
          <div
            key={i}
            className={`miniatura${miniActiva === i ? " active" : ""}`}
            onClick={() => setMiniActiva(i)}
          >
            <img
              src={img}
              alt={`Vista ${i + 1}`}
              onError={(e) => {
                (e.currentTarget.parentElement as HTMLElement).innerHTML = "a";
              }}
            />
          </div>
        ))}

        <div className="miniatura miniatura-mas">
          <span>+ fotos</span>
        </div>
      </div>
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

  const [usuario, setUsuario] = useState<Usuario | undefined>(undefined);

  useEffect(() => {
    setUsuario(getUsuarioSesion());
  }, []);

  useEffect(() => {
    fetch(`/api/canchas/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setCancha({
          ...data,

          descripcion: JSON.parse(data.descripcion || "[]"),

          imagenes: JSON.parse(data.imagenes || "[]"),

          caracteristicas: JSON.parse(
            data.caracteristicas || "[]"
          ),

          horarios: JSON.parse(data.horarios || "[]"),

          resenas: JSON.parse(data.resenas || "[]"),

          disponible_hoy: Boolean(data.disponible_hoy),
        });
      })
      .catch(console.error);
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
                  {cancha.ubicacion} · A {cancha.distancia}
                </p>
              </div>

              <div className="cancha-rating">
                <span className="rating-numero">
                  {cancha.rating}
                </span>

                <div className="rating-estrellas">
                  <Estrellas valor={Number(cancha.rating)} />
                </div>

                <span className="rating-reviews">
                  {cancha.total_resenas} reseñas
                </span>
              </div>
            </div>

            <div className="seccion">
              <h2 className="seccion-titulo">
                Descripción
              </h2>

              {cancha.descripcion.map(
                (parrafo: string, i: number) => (
                  <p key={i} className="cancha-desc">
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
                {cancha.caracteristicas.map(
                  (c: any, index: number) => (
                    <div
                      key={index}
                      className="caract-item"
                    >
                      {c.icono && (
                        <span className="caract-icon">
                          {c.icono}
                        </span>
                      )}

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
                {cancha.horarios.map(
                  (h: any, index: number) => (
                    <div
                      key={index}
                      className={`dia-item${
                        h.esFinde ? " dia-finde" : ""
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
                  ({cancha.total_resenas})
                </span>
              </h2>

              <div className="reseñas-lista">
                {cancha.resenas.map(
                  (r: any, index: number) => (
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
                          <Estrellas valor={r.estrellas} />
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
