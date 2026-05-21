import { useState, useEffect, CSSProperties } from "react";

interface Cancha {
  id: number;           
  nombre: string;
  ubicacion: string;
  tipo: string;
  superficie: string;
  precio: string;
  rating: string;
  disponible: boolean;
}

// Usuario tal como lo guarda el login en localStorage
interface Usuario {
  id: number;
  name: string;
  username: string;
  email: string;
  role: "gestor" | "player";
}

// ─── Helpers de sesión ────
function getUsuario(): Usuario | null {
  try {
    const raw = localStorage.getItem("communifield_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getToken(): string | null {
  return localStorage.getItem("communifield_token");
}


function iniciales(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}


const PALETTE = {
  white: "#ffffff",
  green: "#00ab00",
  greenDark: "#008a00",
  greenLight: "#65c25d",
  greenPale: "#edf7ed",
  yellowGreen: "#b2d100",
  textDark: "#0e260e",
  textBody: "#3d5c3d",
  textSoft: "#6e8f6e",
  border: "rgba(0,171,0,0.18)",
};

type Styles = Record<string, CSSProperties>;

const s: Styles = {
  body: { margin: 0, padding: 0, fontFamily: "'Outfit', sans-serif", background: PALETTE.white, color: PALETTE.textDark, minHeight: "100vh", display: "flex", flexDirection: "column" },

  // Header especial para canchas
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 48px", background: PALETTE.white, borderBottom: `3px solid ${PALETTE.green}`, position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 16px rgba(0,171,0,0.09)" },
  logoWrap: { display: "flex", alignItems: "center", gap: 14 },
  logoCircle: { width: 52, height: 52, borderRadius: "50%", border: `2.5px solid ${PALETTE.green}`, overflow: "hidden", background: PALETTE.greenPale, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  logoImg: { width: "100%", height: "100%", objectFit: "cover" },
  brandName: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, letterSpacing: 5, color: PALETTE.green, margin: 0 },
  headerUsuario: { display: "flex", alignItems: "center", gap: 14, position: "relative" },
  perfilCircle: { width: 42, height: 42, borderRadius: "50%", border: `2.5px solid ${PALETTE.green}`, background: PALETTE.greenPale, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, fontSize: 14, fontWeight: 700, color: PALETTE.green },
  hamburguesa: { display: "flex", flexDirection: "column", justifyContent: "center", gap: 5, width: 38, height: 38, background: "transparent", border: `1.5px solid ${PALETTE.border}`, borderRadius: 8, cursor: "pointer", padding: "8px 9px" },
  hamburguesaLine: { display: "block", height: 2, background: PALETTE.green, borderRadius: 2 },
  menuInfo: { display: "flex", alignItems: "center", gap: 12, padding: "10px 10px 14px" },
  menuAvatar: { width: 40, height: 40, borderRadius: "50%", border: `2px solid ${PALETTE.green}`, background: PALETTE.greenPale, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14, fontWeight: 700, color: PALETTE.green },
  menuNombre: { fontSize: 14, fontWeight: 700, color: PALETTE.textDark, margin: 0 },
  menuEmail: { fontSize: 12, color: PALETTE.textSoft, margin: 0 },
  menuDivider: { border: "none", borderTop: `1.5px solid ${PALETTE.border}`, margin: "4px 0" },
  menuBtn: { display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 9, fontSize: 14, fontWeight: 500, color: PALETTE.textBody, cursor: "pointer", background: "transparent", border: "none", width: "100%", textAlign: "left", fontFamily: "'Outfit', sans-serif" },
  menuBtnRojo: { color: "#c0392b" },

  // Main especial para canchas
  main: { flex: 1, maxWidth: 1200, margin: "0 auto", width: "100%", padding: "0 40px 60px", boxSizing: "border-box" },

  // Buscador 
  buscadorSection: { padding: "52px 0 44px", textAlign: "center" },
  buscadorTag: { display: "inline-block", fontSize: 12, fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase", color: PALETTE.greenLight, marginBottom: 12 },
  buscadorTitulo: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 64, letterSpacing: 2, color: PALETTE.textDark, marginBottom: 32, lineHeight: 1 },
  buscadorSpan: { color: PALETTE.green },
  buscadorWrap: { display: "flex", flexWrap: "wrap", gap: 10, background: PALETTE.white, border: `1.5px solid ${PALETTE.border}`, borderRadius: 14, padding: 10, boxShadow: "0 4px 24px rgba(0,171,0,0.09)", maxWidth: 960, margin: "0 auto" },
  buscadorCampo: { flex: "1 1 180px", display: "flex", alignItems: "center", background: PALETTE.greenPale, borderRadius: 9, padding: "0 14px", border: "1.5px solid transparent" },
  buscadorInput: { flex: 1, border: "none", background: "transparent", fontFamily: "'Outfit', sans-serif", fontSize: 14, color: PALETTE.textDark, padding: "13px 0", outline: "none", width: "100%" },
  buscadorSelect: { flex: 1, border: "none", background: "transparent", fontFamily: "'Outfit', sans-serif", fontSize: 14, color: PALETTE.textDark, padding: "13px 0", outline: "none", width: "100%", appearance: "none" },
  btnBuscar: { background: PALETTE.green, color: PALETTE.white, fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 15, padding: "14px 28px", border: "none", borderRadius: 9, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 },

  // Resultados 
  barra: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  resultado: { fontSize: 14, fontWeight: 600, color: PALETTE.textSoft, margin: 0 },
  orden: { display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: PALETTE.textSoft },
  ordenSelect: { padding: "8px 12px", border: `1.5px solid ${PALETTE.border}`, borderRadius: 8, fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 600, color: PALETTE.textDark, background: PALETTE.white, cursor: "pointer", outline: "none", appearance: "none" },

  // Grid — 4-5 columnas
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 18 },

  // Cards
  imgWrap: { position: "relative", width: "100%", height: 180, background: PALETTE.greenPale, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" },
  imgFallback: { fontSize: 52, color: PALETTE.greenLight, display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", background: PALETTE.greenPale },
  cardTipo: { position: "absolute", bottom: 10, left: 10, background: PALETTE.green, color: PALETTE.white, fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 999 },
  cardId: { position: "absolute", top: 10, left: 10, background: "rgba(0,0,0,0.45)", color: PALETTE.white, fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 999, letterSpacing: 0.5 },
  cardBody: { padding: "16px 18px 18px", display: "flex", flexDirection: "column", gap: 6, flex: 1 },
  cardTop: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  cardNombre: { fontSize: 16, fontWeight: 700, color: PALETTE.textDark, lineHeight: 1.3, margin: 0 },
  cardRating: { fontSize: 13, fontWeight: 700, color: PALETTE.yellowGreen, whiteSpace: "nowrap", flexShrink: 0 },
  cardUbicacion: { fontSize: 13, color: PALETTE.textSoft, fontWeight: 500, margin: 0 },
  cardSuperficie: { fontSize: 12, color: PALETTE.textSoft, margin: 0 },
  cardFooter: { display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8, paddingTop: 12, borderTop: `1.5px solid ${PALETTE.border}` },
  cardPrecio: { display: "flex", alignItems: "baseline", gap: 3 },
  precioValor: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: PALETTE.green, letterSpacing: 1 },
  precioUnidad: { fontSize: 12, color: PALETTE.textSoft, fontWeight: 500 },
  disponible: { fontSize: 11, fontWeight: 700, color: PALETTE.green, background: PALETTE.greenPale, border: `1px solid ${PALETTE.border}`, padding: "3px 10px", borderRadius: 999 },
  ocupada: { fontSize: 11, fontWeight: 700, color: "#c0392b", background: "rgba(192,57,43,0.07)", border: "1px solid rgba(192,57,43,0.2)", padding: "3px 10px", borderRadius: 999 },

  
  skeletonCard: { border: `1.5px solid ${PALETTE.border}`, borderRadius: 16, overflow: "hidden", background: PALETTE.white },
  skeletonImg: { width: "100%", height: 180, background: "#e8f5e8" },
  skeletonBody: { padding: "16px 18px 18px", display: "flex", flexDirection: "column", gap: 10 },
  skeletonLine: { height: 14, borderRadius: 6, background: "#e8f5e8" },

  // Paginación
  paginacion: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 40 },

  // Footer especial para canchas
  footer: { background: PALETTE.green, padding: "28px 48px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 },
  footerBrand: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 4, color: PALETTE.white },
  footerLinks: { display: "flex", gap: 28 },
  footerLink: { color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: 13, fontWeight: 500 },
  footerCopy: { width: "100%", textAlign: "center", color: "rgba(255,255,255,0.45)", fontSize: 12, paddingTop: 14, marginTop: 4, borderTop: "1px solid rgba(255,255,255,0.15)" },
};

const menuItems: string[] = ["Mi perfil", "Mis reservas", "Mis amigos"];

// ─── Header (usuario desde localStorage) ────────────
function Header() {
  const [menuAbierto, setMenuAbierto] = useState<boolean>(false);

  
  const usuario = getUsuario();
  const avatarLetras = usuario ? iniciales(usuario.name) : "?";
  const nombreMostrar = usuario?.name ?? "Invitado";
  const emailMostrar = usuario?.email ?? "";

  function cerrarSesion() {
    localStorage.removeItem("communifield_token");
    localStorage.removeItem("communifield_user");
    window.location.href = "/login"; 
  }

  return (
    <header style={s.header}>
      <div style={s.logoWrap}>
        <div style={s.logoCircle}>
          <img src="./img/logo-color.jpeg" alt="Logo" style={s.logoImg} />
        </div>
        <span style={s.brandName}>COMMUNIFIELD</span>
      </div>

      <div style={s.headerUsuario}>
        
        <div style={s.perfilCircle}>{avatarLetras}</div>

        <button
          style={s.hamburguesa}
          onClick={(e: React.MouseEvent) => { e.stopPropagation(); setMenuAbierto(!menuAbierto); }}
          onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = PALETTE.greenPale; e.currentTarget.style.borderColor = PALETTE.green; }}
          onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = PALETTE.border; }}
        >
          <span style={s.hamburguesaLine} />
          <span style={s.hamburguesaLine} />
          <span style={s.hamburguesaLine} />
        </button>

        <div
          style={{ position: "absolute", top: "calc(100% + 14px)", right: 0, width: 240, background: PALETTE.white, border: `1.5px solid ${PALETTE.border}`, borderRadius: 14, boxShadow: "0 12px 36px rgba(0,0,0,0.12)", padding: 8, zIndex: 200, opacity: menuAbierto ? 1 : 0, transform: menuAbierto ? "translateY(0)" : "translateY(-8px)", pointerEvents: menuAbierto ? "all" : "none", transition: "opacity 0.2s ease, transform 0.2s ease" }}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          
          <div style={s.menuInfo}>
            <div style={s.menuAvatar}>{avatarLetras}</div>
            <div>
              <p style={s.menuNombre}>{nombreMostrar}</p>
              <p style={s.menuEmail}>{emailMostrar}</p>
            </div>
          </div>
          <hr style={s.menuDivider} />

          {menuItems.map((item: string) =>
            item === "Mi perfil" ? (
              <a key={item} href="/perfil" style={{ ...s.menuBtn, textDecoration: "none" }}
                onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.background = PALETTE.greenPale; }}
                onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.background = "transparent"; }}
              >{item}</a>
            ) : (
              <button key={item} style={s.menuBtn}
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = PALETTE.greenPale; }}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = "transparent"; }}
              >{item}</button>
            )
          )}

          <hr style={s.menuDivider} />
         
          <button
            style={{ ...s.menuBtn, ...s.menuBtnRojo }}
            onClick={cerrarSesion}
            onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = "rgba(192,57,43,0.08)"; }}
            onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = "transparent"; }}
          >
            Cerrar sesion
          </button>
        </div>
      </div>
    </header>
  );
}


function SkeletonCard() {
  return (
    <div style={s.skeletonCard}>
      <div style={{ ...s.skeletonImg, animation: "pulse 1.4s ease-in-out infinite" }} />
      <div style={s.skeletonBody}>
        <div style={{ ...s.skeletonLine, width: "70%", animation: "pulse 1.4s ease-in-out infinite" }} />
        <div style={{ ...s.skeletonLine, width: "50%", animation: "pulse 1.4s ease-in-out 0.1s infinite" }} />
        <div style={{ ...s.skeletonLine, width: "40%", animation: "pulse 1.4s ease-in-out 0.2s infinite" }} />
      </div>
    </div>
  );
}

// ─── Card de cancha ──────────
function CanchaCard({ cancha }: { cancha: Cancha }) {
  const [favorito, setFavorito] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{ display: "flex", flexDirection: "column", background: PALETTE.white, border: `1.5px solid ${hovered ? "rgba(0,171,0,0.35)" : PALETTE.border}`, borderRadius: 16, overflow: "hidden", cursor: "pointer", transition: "all 0.25s ease", transform: hovered ? "translateY(-5px)" : "translateY(0)", boxShadow: hovered ? "0 16px 40px rgba(0,0,0,0.10)" : "none" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={s.imgWrap}>
        <div style={s.imgFallback} />

        
        <span style={s.cardId}>#{cancha.id}</span>
        <span style={s.cardTipo}>{cancha.tipo}</span>

        <button
          style={{ position: "absolute", top: 10, right: 10, width: 32, height: 32, background: "rgba(255,255,255,0.9)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, cursor: "pointer", border: "none", color: favorito ? "#e74c3c" : PALETTE.textSoft, backdropFilter: "blur(4px)", transition: "all 0.2s" }}
          onClick={(e: React.MouseEvent) => { e.stopPropagation(); setFavorito(!favorito); }}
        >
          {favorito ? "♥" : "♡"}
        </button>
      </div>

      <div style={s.cardBody}>
        <div style={s.cardTop}>
          <h3 style={s.cardNombre}>{cancha.nombre}</h3>
          <span style={s.cardRating}>★ {cancha.rating}</span>
        </div>
        <p style={s.cardUbicacion}>{cancha.ubicacion}</p>
        <p style={s.cardSuperficie}>{cancha.superficie} · {cancha.dimensiones}</p>
        <div style={s.cardFooter}>
          <div style={s.cardPrecio}>
            <span style={s.precioValor}>{cancha.precio}</span>
            <span style={s.precioUnidad}>/ hora</span>
          </div>
          {cancha.disponible
            ? <span style={s.disponible}>Disponible hoy</span>
            : <span style={s.ocupada}>Sin disponibilidad</span>
          }
        </div>
      </div>
    </div>
  );
}


export default function CanchasPage() {
  
  const [ciudad, setCiudad] = useState("");
  const [tipo, setTipo] = useState("");
  const [superficie, setSuperficie] = useState("");
  const [fecha, setFecha] = useState("");

  
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  
  const [paginaActiva, setPaginaActiva] = useState(1);
  const POR_PAGINA = 10;

  useEffect(() => {
    cargarCanchas({ ciudad: "", tipo: "", superficie: "", fecha: "" });
  }, []);

  // ── Fetch real al backend ──────
  // El token del login se envía en el header Authorization para rutas protegidas.
  // Tu backend recibe los query params y devuelve un array de Cancha con el id de BD.
  //
  // Ejemplo de respuesta esperada del backend:
  // [
  //   { id: 12, nombre: "Cancha El Bosque", ubicacion: "...", tipo: "Futbol 11",
  //     superficie: "Grama sintetica", dimensiones: "100x64 m",
  //     precio: "$120.000", rating: "4.8", disponible: true },
  //   ...
  // ]
  async function cargarCanchas(filtros: { ciudad: string; tipo: string; superficie: string; fecha: string }) {
    setCargando(true);
    setError(null);
    try {
      const token = getToken();
      const params = new URLSearchParams();
      if (filtros.ciudad) params.set("ciudad", filtros.ciudad);
      if (filtros.tipo) params.set("tipo", filtros.tipo);
      if (filtros.superficie) params.set("superficie", filtros.superficie);
      if (filtros.fecha) params.set("fecha", filtros.fecha);

      const res = await fetch(`/api/canchas?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) throw new Error(`Error ${res.status}`);

      const data: Cancha[] = await res.json();
      setCanchas(data);
      setPaginaActiva(1);
    } catch (err) {
      setError("No se pudieron cargar las canchas. Verifica tu conexión o el servidor.");
    } finally {
      setCargando(false);
    }
  }

  function handleBuscar() {
    cargarCanchas({ ciudad, tipo, superficie, fecha });
  }

  const totalPaginas = Math.ceil(canchas.length / POR_PAGINA);
  const canchasPagina = canchas.slice((paginaActiva - 1) * POR_PAGINA, paginaActiva * POR_PAGINA);

  return (
    <div style={s.body}>
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
      `}</style>
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      <Header />

      <main style={s.main}>

        
        <section style={s.buscadorSection}>
          <p style={s.buscadorTag}>Encuentra tu cancha</p>
          <h1 style={s.buscadorTitulo}>
            Donde quieres <span style={s.buscadorSpan}>jugar hoy?</span>
          </h1>

          <div style={s.buscadorWrap}>
            <div style={s.buscadorCampo}>
              <input type="text" placeholder="Ciudad o barrio..." style={s.buscadorInput}
                value={ciudad} onChange={(e) => setCiudad(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleBuscar()}
              />
            </div>

            <div style={s.buscadorCampo}>
              <select style={s.buscadorSelect} value={tipo} onChange={(e) => setTipo(e.target.value)}>
                <option value="">Tipo de cancha</option>
                <option>Futbol 5</option>
                <option>Futbol 7</option>
                <option>Futbol 11</option>
              </select>
            </div>

            <div style={s.buscadorCampo}>
              <select style={s.buscadorSelect} value={superficie} onChange={(e) => setSuperficie(e.target.value)}>
                <option value="">Tipo de superficie</option>
                <option>Grama sintetica</option>
                <option>Grama natural</option>
                <option>Cemento</option>
              </select>
            </div>

            <div style={s.buscadorCampo}>
              <input type="date" style={s.buscadorInput}
                value={fecha} onChange={(e) => setFecha(e.target.value)}
              />
            </div>

            <button style={s.btnBuscar} onClick={handleBuscar}
              onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = PALETTE.greenDark; }}
              onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = PALETTE.green; }}
            >
              Buscar canchas
            </button>
          </div>
        </section>

       
        <div style={s.barra}>
          <p style={s.resultado}>
            {cargando
              ? "Buscando canchas..."
              : `${canchas.length} cancha${canchas.length !== 1 ? "s" : ""} encontrada${canchas.length !== 1 ? "s" : ""}`}
          </p>
          <div style={s.orden}>
            <span>Ordenar por</span>
            <select style={s.ordenSelect}>
              <option>Mas cercanas</option>
              <option>Mejor valoradas</option>
              <option>Menor precio</option>
              <option>Mayor precio</option>
            </select>
          </div>
        </div>

        
        {error ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#c0392b" }}>
            <p style={{ fontSize: 16, fontWeight: 600 }}>{error}</p>
            <button
              style={{ marginTop: 16, padding: "10px 24px", background: PALETTE.green, color: PALETTE.white, border: "none", borderRadius: 9, fontFamily: "'Outfit', sans-serif", fontWeight: 600, cursor: "pointer" }}
              onClick={() => cargarCanchas({ ciudad, tipo, superficie, fecha })}
            >
              Reintentar
            </button>
          </div>
        ) : cargando ? (
          <div style={s.grid}>
            {[...Array(10)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : canchas.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: PALETTE.textSoft }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>🏟️</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: PALETTE.textDark }}>Sin resultados</p>
            <p style={{ fontSize: 14, marginTop: 6 }}>Intenta con otros filtros o una ciudad diferente.</p>
          </div>
        ) : (
          <div style={s.grid}>
            {canchasPagina.map((c) => <CanchaCard key={c.id} cancha={c} />)}
          </div>
        )}

       
        {!cargando && totalPaginas > 1 && (
          <div style={s.paginacion}>
            {[...Array(totalPaginas)].map((_, i) => {
              const n = i + 1;
              return (
                <button key={n} onClick={() => setPaginaActiva(n)}
                  style={{ width: 38, height: 38, borderRadius: 8, border: `1.5px solid ${paginaActiva === n ? PALETTE.green : PALETTE.border}`, background: paginaActiva === n ? PALETTE.green : PALETTE.white, fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 600, color: paginaActiva === n ? PALETTE.white : PALETTE.textBody, cursor: "pointer" }}
                >
                  {n}
                </button>
              );
            })}
          </div>
        )}
      </main>

      <footer style={s.footer}>
        <span style={s.footerBrand}>COMMUNIFIELD</span>
        <div style={s.footerLinks}>
          {["Terminos", "Privacidad", "Contacto"].map((l) => (
            <a key={l} href="#" style={s.footerLink}>{l}</a>
          ))}
        </div>
        <p style={s.footerCopy}>2025 CommuniField · Todos los derechos reservados</p>
      </footer>
    </div>
  );
}