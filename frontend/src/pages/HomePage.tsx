
import '../styles/HomePage.css';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface Feature {
  icono: string;
  titulo: string;
  descripcion: string;
}

const FEATURES: Feature[] = [
  {
    icono: '⚡',
    titulo: 'Reserva en segundos',
    descripcion:
      'Consulta disponibilidad en tiempo real y confirma tu cancha sin llamadas ni filas, desde cualquier dispositivo.',
  },
  {
    icono: '👥',
    titulo: 'Partidos abiertos',
    descripcion:
      '¿Te falta gente? Crea un partido abierto y conecta con jugadores cercanos que buscan equipo en tu horario.',
  },
];

export default function HomePage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />

      <main className="home-main">
        {/* ── HERO ── */}
        <section className="hero">
          <div className="hero-inner">
            <p className="hero-tag">Plataforma deportiva · Colombia</p>
            <h1>
              Reserva canchas,<br />
              <span>conecta jugadores</span>
            </h1>
            <p className="hero-desc">
              CommuniField une a la comunidad futbolera facilitando la reserva de canchas privadas
              de forma rápida y organizada. Crea partidos abiertos, aprovecha cada espacio y
              conoce nuevas personas.
            </p>
            <div className="hero-ctas">
              
              <a href="/canchas" className="cta-outline">Ver canchas →</a>
            </div>
          </div>

          <div className="hero-graphic">
            <div className="graphic-circle">
              <img
                src="/img/logo-color.jpeg"
                alt="CommuniField Logo"
                className="graphic-icon"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).outerHTML =
                    '<span class="graphic-fallback">⚽</span>';
                }}
              />
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section className="features">
          {FEATURES.map((f) => (
            <div className="feature-card" key={f.titulo}>
              <div className="feature-icon">{f.icono}</div>
              <h3>{f.titulo}</h3>
              <p>{f.descripcion}</p>
            </div>
          ))}
        </section>

        {/* ── CTA BANNER ── */}
        <section className="cta-banner">
          <div>
            <h2>¿Listo para jugar?</h2>
            <p>Inicio gratuito, sin complicaciones. Únete hoy.</p>
          </div>
          <a href="/login" className="btn-banner">Iniciar gratis →</a>
        </section>
      </main>

      <Footer />
    </div>
  );
}
