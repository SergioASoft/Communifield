
import { useState } from 'react';
import '../styles/CanchaPage.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ReservaPanel from '../components/ReservaPanel';
import { Cancha, Usuario } from '../types';
import { CANCHA_EJEMPLO } from '../data/canchaData';

const USUARIO_EJEMPLO: Usuario = {
  nombre:    'Juan Mejía',
  email:     'juan@correo.com',
  iniciales: 'JM',
  avatarUrl: '/img/avatar.jpeg',
};

interface GaleriaProps {
  cancha: Cancha;
}

function Galeria({ cancha }: GaleriaProps) {
  const [miniActiva, setMiniActiva] = useState(0);

  return (
    <section className="galeria">
      <div className="galeria-principal">
        <img
          src={`/img/ejemplo.cancha.png`}
          alt={cancha.nombre}
          onError={(e) => {
            const el = e.currentTarget.parentElement!;
            el.innerHTML = `<div class="galeria-placeholder"><span></span><p>Foto principal</p></div>`;
          }}
        />
      </div>
      <div className="galeria-miniaturas">
        {[1, 2, 3].map((n, i) => (
          <div
            key={n}
            className={`miniatura${miniActiva === i ? ' active' : ''}`}
            onClick={() => setMiniActiva(i)}
          >
            <img
              src={`/img/ejemplo.cancha.png`}
              alt={`Vista ${n}`}
              onError={(e) => {
                (e.currentTarget.parentElement as HTMLElement).innerHTML = 'a';
              }}
            />
          </div>
        ))}
        <div className="miniatura miniatura-mas">
          <span>+1 fotos</span>
        </div>
      </div>
    </section>
  );
}

function Estrellas({ valor }: { valor: number }) {
  return (
    <>
      {'★'.repeat(Math.floor(valor))}
      {'☆'.repeat(5 - Math.floor(valor))}
    </>
  );
}

export default function CanchaPage() {
  const cancha = CANCHA_EJEMPLO; 

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header usuario={USUARIO_EJEMPLO} />

      <main className="cancha-main">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <a href="#">Inicio</a>
          <span>›</span>
          <a href="#">Canchas</a>
          <span>›</span>
          <span className="breadcrumb-active">{cancha.nombre}</span>
        </nav>

        {/* Galería */}
        <Galeria cancha={cancha} />

        {/* Layout principal */}
        <div className="cancha-layout">

          {/* ── Columna izquierda: Info ── */}
          <div className="cancha-info">

            {/* Cabecera */}
            <div className="cancha-header">
              <div>
                <div className="cancha-badges">
                  <span className="badge badge-tipo">{cancha.tipo}</span>
                  {cancha.disponibleHoy && (
                    <span className="badge badge-disponible">Disponible hoy</span>
                  )}
                </div>
                <h1 className="cancha-nombre">{cancha.nombre}</h1>
                <p className="cancha-ubicacion">
                   {cancha.ubicacion} · A {cancha.distancia}
                </p>
              </div>
              <div className="cancha-rating">
                <span className="rating-numero">{cancha.rating}</span>
                <div className="rating-estrellas">
                  <Estrellas valor={cancha.rating} />
                </div>
                <span className="rating-reviews">{cancha.totalReseñas} reseñas</span>
              </div>
            </div>

            {/* Descripción */}
            <div className="seccion">
              <h2 className="seccion-titulo">Descripción</h2>
              {cancha.descripcion.map((parrafo, i) => (
                <p key={i} className="cancha-desc">{parrafo}</p>
              ))}
            </div>

            {/* Características */}
            <div className="seccion">
              <h2 className="seccion-titulo">Características</h2>
              <div className="caracteristicas-grid">
                {cancha.caracteristicas.map((c) => (
                  <div key={c.label} className="caract-item">
                    {c.icono && <span className="caract-icon">{c.icono}</span>}
                    <div>
                      <p className="caract-label">{c.label}</p>
                      <p className="caract-valor">{c.valor}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Horarios */}
            <div className="seccion">
              <h2 className="seccion-titulo">Horarios disponibles</h2>
              <div className="horarios-semana">
                {cancha.horarios.map((h) => (
                  <div
                    key={h.dia}
                    className={`dia-item${h.esFinde ? ' dia-finde' : ''}`}
                  >
                    <span className="dia-nombre">{h.dia}</span>
                    <span className="dia-horas">{h.horas}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reseñas */}
            <div className="seccion">
              <h2 className="seccion-titulo">
                Reseñas <span className="reseñas-count">({cancha.totalReseñas})</span>
              </h2>
              <div className="reseñas-lista">
                {cancha.reseñas.map((r, i) => (
                  <div key={i} className="reseña-card">
                    <div className="reseña-header">
                      <div className="reseña-avatar">{r.iniciales}</div>
                      <div>
                        <p className="reseña-nombre">{r.nombre}</p>
                        <p className="reseña-fecha">{r.fecha}</p>
                      </div>
                      <div className="reseña-stars">
                        <Estrellas valor={r.estrellas} />
                      </div>
                    </div>
                    <p className="reseña-texto">{r.texto}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>{/* /cancha-info */}

          {/* ── Columna derecha: Reserva ── */}
          <ReservaPanel cancha={cancha} />

        </div>{/* /cancha-layout */}
      </main>

      <Footer />
    </div>
  );
}
