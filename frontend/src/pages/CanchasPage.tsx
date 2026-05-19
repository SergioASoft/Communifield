import { useState, CSSProperties } from "react";

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

interface Cancha {
  id: number;
  nombre: string;
  ubicacion: string;
  tipo: string;
  superficie: string;
  dimensiones: string;
  precio: string;
  rating: string;
  disponible: boolean;
}

const canchas: Cancha[] = [
  { id: 1, nombre: "Cancha El Bosque", ubicacion: "El Bosque, Armenia, Quindio", tipo: "Futbol 11", superficie: "Grama sintetica", dimensiones: "100x64 m", precio: "$120.000", rating: "4.8", disponible: true },
  { id: 2, nombre: "Cancha La Patria", ubicacion: "La Patria, Armenia, Quindio", tipo: "Futbol 7", superficie: "Grama sintetica", dimensiones: "70x45 m", precio: "$80.000", rating: "4.5", disponible: true },
  { id: 3, nombre: "Cancha Los Pinos", ubicacion: "Los Pinos, Armenia, Quindio", tipo: "Futbol 5", superficie: "Cemento", dimensiones: "40x25 m", precio: "$50.000", rating: "4.2", disponible: false },
  { id: 4, nombre: "Cancha El Cafetal", ubicacion: "Centro, Armenia, Quindio", tipo: "Futbol 11", superficie: "Grama natural", dimensiones: "105x68 m", precio: "$180.000", rating: "4.9", disponible: true },
  { id: 5, nombre: "Cancha Villa Restrepo", ubicacion: "Villa Restrepo, Armenia, Quindio", tipo: "Futbol 7", superficie: "Grama sintetica", dimensiones: "65x42 m", precio: "$90.000", rating: "4.6", disponible: true },
  { id: 6, nombre: "Cancha El Guadual", ubicacion: "El Guadual, Armenia, Quindio", tipo: "Futbol 5", superficie: "Grama sintetica", dimensiones: "38x22 m", precio: "$60.000", rating: "4.3", disponible: true },
];

type Styles = Record<string, CSSProperties>;

const s: Styles = {
  body: { margin: 0, padding: 0, fontFamily: "'Outfit', sans-serif", background: PALETTE.white, color: PALETTE.textDark, minHeight: "100vh", display: "flex", flexDirection: "column" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 48px", background: PALETTE.white, borderBottom: `3px solid ${PALETTE.green}`, position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 16px rgba(0,171,0,0.09)" },
  logoWrap: { display: "flex", alignItems: "center", gap: 14 },
  logoCircle: { width: 52, height: 52, borderRadius: "50%", border: `2.5px solid ${PALETTE.green}`, overflow: "hidden", background: PALETTE.greenPale, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  logoImg: { width: "100%", height: "100%", objectFit: "cover" },
  brandName: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, letterSpacing: 5, color: PALETTE.green, margin: 0 },
  headerUsuario: { display: "flex", alignItems: "center", gap: 14, position: "relative" },
  perfilCircle: { width: 42, height: 42, borderRadius: "50%", border: `2.5px solid ${PALETTE.green}`, overflow: "hidden", background: PALETTE.greenPale, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 },
  hamburguesa: { display: "flex", flexDirection: "column", justifyContent: "center", gap: 5, width: 38, height: 38, background: "transparent", border: `1.5px solid ${PALETTE.border}`, borderRadius: 8, cursor: "pointer", padding: "8px 9px" },
  hamburguesaLine: { display: "block", height: 2, background: PALETTE.green, borderRadius: 2 },
  menuInfo: { display: "flex", alignItems: "center", gap: 12, padding: "10px 10px 14px" },
  menuAvatar: { width: 40, height: 40, borderRadius: "50%", border: `2px solid ${PALETTE.green}`, background: PALETTE.greenPale, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14, fontWeight: 700, color: PALETTE.green },
  menuNombre: { fontSize: 14, fontWeight: 700, color: PALETTE.textDark, margin: 0 },
  menuEmail: { fontSize: 12, color: PALETTE.textSoft, margin: 0 },
  menuDivider: { border: "none", borderTop: `1.5px solid ${PALETTE.border}`, margin: "4px 0" },
  menuBtn: { display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 9, fontSize: 14, fontWeight: 500, color: PALETTE.textBody, cursor: "pointer", background: "transparent", border: "none", width: "100%", textAlign: "left", fontFamily: "'Outfit', sans-serif" },
  menuBtnRojo: { color: "#c0392b" },
  main: { flex: 1, maxWidth: 1200, margin: "0 auto", width: "100%", padding: "0 40px 60px", boxSizing: "border-box" },
  buscadorSection: { padding: "52px 0 44px", textAlign: "center" },
  buscadorTag: { display: "inline-block", fontSize: 12, fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase", color: PALETTE.greenLight, marginBottom: 12 },
  buscadorTitulo: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 64, letterSpacing: 2, color: PALETTE.textDark, marginBottom: 32, lineHeight: 1 },
  buscadorSpan: { color: PALETTE.green },
  buscadorWrap: { display: "flex", gap: 10, background: PALETTE.white, border: `1.5px solid ${PALETTE.border}`, borderRadius: 14, padding: 10, boxShadow: "0 4px 24px rgba(0,171,0,0.09)", maxWidth: 860, margin: "0 auto" },
  buscadorCampo: { flex: 1, display: "flex", alignItems: "center", background: PALETTE.greenPale, borderRadius: 9, padding: "0 14px", border: "1.5px solid transparent" },
  buscadorInput: { flex: 1, border: "none", background: "transparent", fontFamily: "'Outfit', sans-serif", fontSize: 14, color: PALETTE.textDark, padding: "13px 0", outline: "none", width: "100%" },
  buscadorSelect: { flex: 1, border: "none", background: "transparent", fontFamily: "'Outfit', sans-serif", fontSize: 14, color: PALETTE.textDark, padding: "13px 0", outline: "none", width: "100%", appearance: "none" },
  btnBuscar: { background: PALETTE.green, color: PALETTE.white, fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 15, padding: "14px 28px", border: "none", borderRadius: 9, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 },
  layout: { display: "grid", gridTemplateColumns: "240px 1fr", gap: 32, alignItems: "start" },
  filtrosPanel: { position: "sticky", top: 90, background: PALETTE.white, border: `1.5px solid ${PALETTE.border}`, borderRadius: 16, padding: "24px 20px" },
  filtrosTitulo: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 1.5, color: PALETTE.textDark, marginBottom: 20, marginTop: 0 },
  filtroGrupo: { padding: "18px 0", borderTop: `1.5px solid ${PALETTE.border}` },
  filtroLabel: { fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: PALETTE.textSoft, marginBottom: 12, display: "block" },
  filtroCheck: { display: "flex", alignItems: "center", gap: 9, fontSize: 14, color: PALETTE.textBody, marginBottom: 9, cursor: "pointer" },
  filtroRango: { display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: PALETTE.textSoft, fontWeight: 500 },
  filtroStars: { display: "flex", gap: 6 },
  btnLimpiar: { width: "100%", marginTop: 20, padding: 10, borderRadius: 8, border: `1.5px solid ${PALETTE.border}`, background: PALETTE.white, fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 600, color: PALETTE.textSoft, cursor: "pointer" },
  barra: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  resultado: { fontSize: 14, fontWeight: 600, color: PALETTE.textSoft, margin: 0 },
  orden: { display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: PALETTE.textSoft },
  ordenSelect: { padding: "8px 12px", border: `1.5px solid ${PALETTE.border}`, borderRadius: 8, fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 600, color: PALETTE.textDark, background: PALETTE.white, cursor: "pointer", outline: "none", appearance: "none" },
  grid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 },
  imgWrap: { position: "relative", width: "100%", height: 180, background: PALETTE.greenPale, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" },
  imgFallback: { fontSize: 52, color: PALETTE.greenLight, display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", background: PALETTE.greenPale },
  cardTipo: { position: "absolute", bottom: 10, left: 10, background: PALETTE.green, color: PALETTE.white, fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 999 },
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
  paginacion: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 40 },
  pagSep: { fontSize: 14, color: PALETTE.textSoft, padding: "0 4px" },
  footer: { background: PALETTE.green, padding: "28px 48px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 },
  footerBrand: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 4, color: PALETTE.white },
  footerLinks: { display: "flex", gap: 28 },
  footerLink: { color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: 13, fontWeight: 500 },
  footerCopy: { width: "100%", textAlign: "center", color: "rgba(255,255,255,0.45)", fontSize: 12, paddingTop: 14, marginTop: 4, borderTop: "1px solid rgba(255,255,255,0.15)" },
};

const menuItems: string[] = ["Mi perfil", "Mis reservas", "Mis partidos", "Configuracion"];

function Header() {
  const [menuAbierto, setMenuAbierto] = useState<boolean>(false);

  return (
    <header style={s.header}>
      <div style={s.logoWrap}>
        <div style={s.logoCircle}>
          <img src="./img/logo-color.jpeg" alt="Logo" style={s.logoImg} />
        </div>
        <span style={s.brandName}>COMMUNIFIELD</span>
      </div>

      <div style={s.headerUsuario}>
        <div style={s.perfilCircle}>
          <span style={{ fontSize: 15, fontWeight: 700, color: PALETTE.green }}>LR</span>
        </div>

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
            <div style={s.menuAvatar}>LR</div>
            <div>
              <p style={s.menuNombre}>Lissa Ramírez</p>
              <p style={s.menuEmail}>lissa@communifield.com</p>
            </div>
          </div>
          <hr style={s.menuDivider} />
          {menuItems.map((item: string) => (
  item === "Mi perfil" ? (
    <a
      key={item}
      href="/perfil"
      style={{ ...s.menuBtn, textDecoration: "none" }}
      onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
        e.currentTarget.style.background = PALETTE.greenPale;
      }}
      onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      {item}
    </a>
  ) : (
    <button
      key={item}
      style={s.menuBtn}
      onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
        e.currentTarget.style.background = PALETTE.greenPale;
      }}
      onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      {item}
    </button>
  )
))}
          <hr style={s.menuDivider} />
          <button style={{ ...s.menuBtn, ...s.menuBtnRojo }}
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

interface CanchaCardProps {
  cancha: Cancha;
}

function CanchaCard({ cancha }: CanchaCardProps) {
  const [favorito, setFavorito] = useState<boolean>(false);
  const [hovered, setHovered] = useState<boolean>(false);

  return (
    <div
      style={{ display: "flex", flexDirection: "column", background: PALETTE.white, border: `1.5px solid ${hovered ? "rgba(0,171,0,0.35)" : PALETTE.border}`, borderRadius: 16, overflow: "hidden", cursor: "pointer", transition: "all 0.25s ease", transform: hovered ? "translateY(-5px)" : "translateY(0)", boxShadow: hovered ? "0 16px 40px rgba(0,0,0,0.10)" : "none" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={s.imgWrap}>
        <div style={s.imgFallback} />
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

interface FiltrosProps {
  rangoPrecio: number;
  setRangoPrecio: (v: number) => void;
  starActivo: string;
  setStarActivo: (v: string) => void;
}

function Filtros({ rangoPrecio, setRangoPrecio, starActivo, setStarActivo }: FiltrosProps) {
  const tipos: string[] = ["Futbol 5", "Futbol 7", "Futbol 11"];
  const superficies: string[] = ["Grama sintetica", "Grama natural", "Cemento"];
  const stars: string[] = ["4+", "3+", "Todas"];

  const [tiposActivos, setTiposActivos] = useState<Record<string, boolean>>({ "Futbol 5": true, "Futbol 7": true, "Futbol 11": true });
  const [superficiesActivas, setSuperficiesActivas] = useState<Record<string, boolean>>({ "Grama sintetica": true, "Grama natural": false, "Cemento": false });

  return (
    <aside style={s.filtrosPanel}>
      <h2 style={s.filtrosTitulo}>Filtros</h2>

      <div style={s.filtroGrupo}>
        <span style={s.filtroLabel}>Tipo de cancha</span>
        {tipos.map((t: string) => (
          <label key={t} style={s.filtroCheck}>
            <input type="checkbox" checked={tiposActivos[t]} onChange={() => setTiposActivos({ ...tiposActivos, [t]: !tiposActivos[t] })} style={{ accentColor: PALETTE.green, width: 16, height: 16, cursor: "pointer" }} />
            {t}
          </label>
        ))}
      </div>

      <div style={s.filtroGrupo}>
        <span style={s.filtroLabel}>Superficie</span>
        {superficies.map((sup: string) => (
          <label key={sup} style={s.filtroCheck}>
            <input type="checkbox" checked={superficiesActivas[sup]} onChange={() => setSuperficiesActivas({ ...superficiesActivas, [sup]: !superficiesActivas[sup] })} style={{ accentColor: PALETTE.green, width: 16, height: 16, cursor: "pointer" }} />
            {sup}
          </label>
        ))}
      </div>

      <div style={s.filtroGrupo}>
        <span style={s.filtroLabel}>Precio por hora</span>
        <div style={s.filtroRango}>
          <span>$50.000</span>
          <input type="range" min={50000} max={300000} value={rangoPrecio} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRangoPrecio(Number(e.target.value))} style={{ flex: 1, accentColor: PALETTE.green, cursor: "pointer" }} />
          <span>${rangoPrecio.toLocaleString("es-CO")}</span>
        </div>
      </div>

      <div style={s.filtroGrupo}>
        <span style={s.filtroLabel}>Calificacion minima</span>
        <div style={s.filtroStars}>
          {stars.map((star: string) => (
            <button key={star} style={{ flex: 1, padding: "7px 6px", borderRadius: 8, border: `1.5px solid ${starActivo === star ? PALETTE.green : PALETTE.border}`, background: starActivo === star ? PALETTE.green : PALETTE.white, fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 600, color: starActivo === star ? PALETTE.white : PALETTE.textSoft, cursor: "pointer" }} onClick={() => setStarActivo(star)}>
              {star}
            </button>
          ))}
        </div>
      </div>

      <button style={s.btnLimpiar}
        onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.borderColor = "#c0392b"; e.currentTarget.style.color = "#c0392b"; }}
        onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.borderColor = PALETTE.border; e.currentTarget.style.color = PALETTE.textSoft; }}
      >
        Limpiar filtros
      </button>
    </aside>
  );
}

export default function CanchasPage() {
  const [rangoPrecio, setRangoPrecio] = useState<number>(200000);
  const [starActivo, setStarActivo] = useState<string>("4+");
  const [paginaActiva, setPaginaActiva] = useState<number>(1);

  const paginas: number[] = [1, 2, 3];

  return (
    <div style={s.body}>
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
              <input type="text" placeholder="Ciudad o barrio..." style={s.buscadorInput} />
            </div>
            <div style={s.buscadorCampo}>
              <select style={s.buscadorSelect}>
                <option value="">Tipo de cancha</option>
                <option>Futbol 5</option>
                <option>Futbol 7</option>
                <option>Futbol 11</option>
              </select>
            </div>
            <div style={s.buscadorCampo}>
              <input type="date" style={s.buscadorInput} />
            </div>
            <button style={s.btnBuscar}
              onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = PALETTE.greenDark; }}
              onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = PALETTE.green; }}
            >
              Buscar canchas
            </button>
          </div>
        </section>

        <div style={s.layout}>
          <Filtros rangoPrecio={rangoPrecio} setRangoPrecio={setRangoPrecio} starActivo={starActivo} setStarActivo={setStarActivo} />

          <div>
            <div style={s.barra}>
              <p style={s.resultado}>{canchas.length} canchas encontradas</p>
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

            <div style={s.grid}>
              {canchas.map((c: Cancha) => (
                <CanchaCard key={c.id} cancha={c} />
              ))}
            </div>

            <div style={s.paginacion}>
              {paginas.map((n: number) => (
                <button key={n} onClick={() => setPaginaActiva(n)}
                  style={{ width: 38, height: 38, borderRadius: 8, border: `1.5px solid ${paginaActiva === n ? PALETTE.green : PALETTE.border}`, background: paginaActiva === n ? PALETTE.green : PALETTE.white, fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 600, color: paginaActiva === n ? PALETTE.white : PALETTE.textBody, cursor: "pointer" }}
                >
                  {n}
                </button>
              ))}
              <span style={s.pagSep}>...</span>
              <button onClick={() => setPaginaActiva(6)} style={{ width: 38, height: 38, borderRadius: 8, border: `1.5px solid ${PALETTE.border}`, background: PALETTE.white, fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 600, color: PALETTE.textBody, cursor: "pointer" }}>6</button>
            </div>
          </div>
        </div>
      </main>

      <footer style={s.footer}>
        <span style={s.footerBrand}>COMMUNIFIELD</span>
        <div style={s.footerLinks}>
          {["Terminos", "Privacidad", "Contacto"].map((l: string) => (
            <a key={l} href="#" style={s.footerLink}>{l}</a>
          ))}
        </div>
        <p style={s.footerCopy}>2025 CommuniField · Todos los derechos reservados</p>
      </footer>
    </div>
  );
}