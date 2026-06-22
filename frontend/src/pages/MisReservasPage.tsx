import { useEffect, useMemo, useState, type ComponentType } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Clock, CreditCard, History, ListChecks, MapPin } from "lucide-react";

import Header from "../components/Header";
import Footer from "../components/Footer";
import { Usuario } from "../types";
import "../styles/MisReservasPage.css";

type ReservaUsuario = {
  idEvento: number;
  canchaId: number;
  canchaNombre: string;
  canchaTipo: string;
  canchaUbicacion: string;
  canchaImagen?: string | null;
  fechaInicio: string;
  fechaFin: string;
  subtotal: number;
  pago: {
    idPago: number;
    total: number;
    metodo: string;
    estado: "pendiente" | "pagado" | "fallido" | "cancelado";
    referencia?: string | null;
    fechaPago?: string | null;
  };
};

type ReservaFiltro = "todas" | "proximas" | "historial";

const FILTROS: Array<{
  id: ReservaFiltro;
  label: string;
  icon: ComponentType<{ size?: number }>;
}> = [
  { id: "todas", label: "Todas", icon: ListChecks },
  { id: "proximas", label: "Proximas", icon: CalendarDays },
  { id: "historial", label: "Historial", icon: History },
];

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
    const name = user.name || user.nombre || "Usuario";

    return {
      nombre: name,
      email: user.email || "",
      iniciales: getInitials(name),
      avatarUrl: user.photo || user.avatarUrl || undefined,
    };
  } catch (error) {
    console.error("[MisReservasPage] No se pudo leer el usuario local", error);
    return undefined;
  }
}

function parseLocalDate(value: string) {
  const normalized = value.includes("T") ? value.slice(0, 19).replace("T", " ") : value;
  const [datePart, timePart = "00:00:00"] = normalized.split(" ");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hours, minutes, seconds] = timePart.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes, seconds || 0);
}

function formatDate(value: string) {
  return parseLocalDate(value).toLocaleDateString("es-CO", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTimeRange(start: string, end: string) {
  const startDate = parseLocalDate(start);
  const endDate = parseLocalDate(end);

  return `${startDate.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  })} - ${endDate.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function formatCOP(value: number) {
  return value.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

function getEstadoReserva(reserva: ReservaUsuario) {
  const isPast = parseLocalDate(reserva.fechaFin).getTime() < Date.now();
  if (reserva.pago.estado !== "pagado") return reserva.pago.estado;
  return isPast ? "finalizada" : "confirmada";
}

function ReservaCard({ reserva }: { reserva: ReservaUsuario }) {
  const estado = getEstadoReserva(reserva);

  return (
    <article className="reserva-user-card">
      <div className="reserva-user-media">
        {reserva.canchaImagen ? (
          <img src={reserva.canchaImagen} alt={reserva.canchaNombre} />
        ) : (
          <div className="reserva-user-placeholder">CF</div>
        )}
      </div>

      <div className="reserva-user-content">
        <div className="reserva-user-top">
          <div>
            <span className="reserva-user-type">{reserva.canchaTipo}</span>
            <h2>{reserva.canchaNombre}</h2>
          </div>
          <span className={`reserva-status reserva-status-${estado}`}>{estado}</span>
        </div>

        <div className="reserva-user-meta">
          <span>
            <CalendarDays size={16} />
            {formatDate(reserva.fechaInicio)}
          </span>
          <span>
            <Clock size={16} />
            {formatTimeRange(reserva.fechaInicio, reserva.fechaFin)}
          </span>
          <span>
            <MapPin size={16} />
            {reserva.canchaUbicacion}
          </span>
        </div>

        <div className="reserva-user-bottom">
          <div className="reserva-payment">
            <CreditCard size={17} />
            <span>
              {reserva.pago.metodo} · {formatCOP(reserva.pago.total)}
            </span>
          </div>

          <a className="reserva-detail-link" href={`/canchas/${reserva.canchaId}`}>
            Ver cancha
          </a>
        </div>

        {reserva.pago.referencia && (
          <p className="reserva-reference">Ref. {reserva.pago.referencia}</p>
        )}
      </div>
    </article>
  );
}

export default function MisReservasPage() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<Usuario | undefined>(undefined);
  const [reservas, setReservas] = useState<ReservaUsuario[]>([]);
  const [filtro, setFiltro] = useState<ReservaFiltro>("proximas");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setUsuario(getUsuarioSesion());
  }, []);

  useEffect(() => {
    async function cargarReservas() {
      const token = localStorage.getItem("communifield_token");

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const res = await fetch("/api/reservas/mis-reservas", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();

        if (!res.ok) {
          console.error("[MisReservasPage] Error cargando reservas", {
            status: res.status,
            data,
          });
          throw new Error(data.message || "No se pudieron cargar tus reservas");
        }

        setReservas(data.reservas || []);
      } catch (error: any) {
        console.error("[MisReservasPage] Fallo al cargar reservas", error);
        setError(error.message || "No se pudieron cargar tus reservas.");
      } finally {
        setLoading(false);
      }
    }

    cargarReservas();
  }, [navigate]);

  const reservasSeparadas = useMemo(() => {
    const now = Date.now();
    const proximas = reservas
      .filter((reserva) => parseLocalDate(reserva.fechaFin).getTime() >= now)
      .sort(
        (a, b) =>
          parseLocalDate(a.fechaInicio).getTime() - parseLocalDate(b.fechaInicio).getTime()
      );
    const historial = reservas
      .filter((reserva) => parseLocalDate(reserva.fechaFin).getTime() < now)
      .sort(
        (a, b) =>
          parseLocalDate(b.fechaInicio).getTime() - parseLocalDate(a.fechaInicio).getTime()
      );

    return {
      todas: [...proximas, ...historial],
      proximas,
      historial,
    };
  }, [reservas]);

  const reservasFiltradas = reservasSeparadas[filtro];

  return (
    <div className="mis-reservas-page">
      <Header usuario={usuario} />

      <main className="mis-reservas-main">
        <button
          className="back-button reservas-back-button"
          type="button"
          onClick={() => navigate(-1)}
        >
          ← Retroceder
        </button>

        <section className="reservas-heading">
          <div>
            <span className="reservas-eyebrow">Reservas</span>
            <h1>Mis reservas</h1>
            <p>Consulta tus proximas reservas y el historial de canchas ya utilizadas.</p>
          </div>

          <div className="reservas-summary">
            <strong>{reservasSeparadas.proximas.length}</strong>
            <span>proximas</span>
          </div>
        </section>

        <section className="reservas-tabs" aria-label="Filtros de reservas">
          {FILTROS.map((item) => {
            const Icon = item.icon;
            const total = reservasSeparadas[item.id].length;

            return (
              <button
                key={item.id}
                type="button"
                className={`reservas-tab${filtro === item.id ? " active" : ""}`}
                onClick={() => setFiltro(item.id)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                <strong>{total}</strong>
              </button>
            );
          })}
        </section>

        {loading ? (
          <div className="reservas-empty">Cargando tus reservas...</div>
        ) : error ? (
          <div className="reservas-empty reservas-error">{error}</div>
        ) : reservasFiltradas.length === 0 ? (
          <div className="reservas-empty">
            No hay reservas en esta vista.
            <a href="/canchas">Explorar canchas</a>
          </div>
        ) : (
          <section className="reservas-list">
            {reservasFiltradas.map((reserva) => (
              <ReservaCard key={reserva.idEvento} reserva={reserva} />
            ))}
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
