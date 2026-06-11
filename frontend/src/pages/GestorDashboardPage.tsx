import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { BarChart, ChartCard, LineChart, PieChart, StatCard } from "../components/dashboard/DashboardCharts";
import "../components/dashboard/DashboardPage.css";
import {
  getManagerDashboard,
  periodOptions,
  type DashboardPeriod,
  type ManagerDashboardStats,
} from "../services/dashboardService";
import type { Usuario } from "../types";

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
      .map((part: string) => part[0])
      .join("")
      .toUpperCase(),
    avatarUrl: user.photo || user.foto || undefined,
  };
}

function money(value: number) {
  return Number(value || 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

function formatEventDate(value: string) {
  if (!value) return "Sin fecha";

  return new Date(value).toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function GestorDashboardPage() {
  const navigate = useNavigate();
  const [usuario] = useState<Usuario | undefined>(getUsuarioHeader());
  const [period, setPeriod] = useState<DashboardPeriod>("month");
  const [stats, setStats] = useState<ManagerDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!localStorage.getItem("communifield_token")) {
      navigate("/login");
      return;
    }

    let ignore = false;

    async function loadStats() {
      try {
        setLoading(true);
        setError("");
        const data = await getManagerDashboard(period);
        if (!ignore) setStats(data);
      } catch {
        if (!ignore) setError("No se pudieron cargar las estadisticas del gestor.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadStats();

    return () => {
      ignore = true;
    };
  }, [navigate, period]);

  const bestCourt = useMemo(() => {
    const sorted = [...(stats?.eventsByCourt || [])].sort((a, b) => Number(b.value) - Number(a.value));
    return sorted[0]?.label || "Sin datos";
  }, [stats]);

  return (
    <div className="dash-shell">
      <Header usuario={usuario} />

      <main className="dash-page dash-page-public">
        <button type="button" className="dash-back-button" onClick={() => navigate("/")}>
          <ArrowLeft size={17} strokeWidth={2.4} />
          Retroceder
        </button>

        <section className="dash-title-row">
          <div>
            <p>Panel del gestor</p>
            <h2>Dashboard de canchas y eventos</h2>
            <span>Rendimiento de tus espacios, pagos, reseñas y eventos proximos.</span>
          </div>

          <div className="dash-period-tabs" aria-label="Filtro de periodo">
            {periodOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={period === option.value ? "active" : ""}
                onClick={() => setPeriod(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        {error && <p className="dash-error">{error}</p>}
        {loading && <p className="dash-loading">Cargando estadisticas...</p>}

        {stats && !loading && (
          <>
            <section className="dash-stat-grid">
              <StatCard label="Mis canchas" value={stats.summary.courts} hint="Espacios administrados" />
              <StatCard label="Eventos del periodo" value={stats.summary.events} hint={`Mayor actividad: ${bestCourt}`} />
              <StatCard label="Ingresos por eventos" value={money(stats.summary.revenue)} hint="Pagos confirmados" />
              <StatCard label="Rating promedio" value={stats.summary.averageRating.toFixed(1)} hint={`${stats.summary.totalReviews} reseñas`} />
            </section>

            <section className="dash-chart-grid">
              <ChartCard title="Eventos por cancha" subtitle="Demanda por espacio">
                <BarChart data={stats.eventsByCourt} />
              </ChartCard>

              <ChartCard title="Ingresos por cancha" subtitle="Pagos confirmados">
                <BarChart data={stats.revenueByCourt} money />
              </ChartCard>

              <ChartCard title="Eventos por dia" subtitle="Actividad del periodo">
                <LineChart data={stats.eventsByDay} />
              </ChartCard>

              <ChartCard title="Estado de mis canchas" subtitle="Operacion actual">
                <PieChart data={stats.courtsByStatus} />
              </ChartCard>

              <ChartCard title="Metodos de pago" subtitle="Preferencias de tus clientes">
                <BarChart data={stats.paymentMethods} />
              </ChartCard>

              <ChartCard title="Proximos eventos" subtitle="Agenda inmediata">
                <div className="dash-events-list">
                  {stats.upcomingEvents.length === 0 ? (
                    <p className="dash-empty">No tienes eventos proximos registrados.</p>
                  ) : (
                    stats.upcomingEvents.map((event) => (
                      <article key={event.id_evento}>
                        <div>
                          <strong>{event.courtName}</strong>
                          <span>{formatEventDate(event.startsAt)}</span>
                        </div>
                        <p>{event.maxPlayers} jugadores max.</p>
                      </article>
                    ))
                  )}
                </div>
              </ChartCard>
            </section>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
