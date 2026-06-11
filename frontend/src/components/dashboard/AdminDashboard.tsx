import { useEffect, useMemo, useState } from "react";
import {
  getAdminDashboard,
  periodOptions,
  type AdminDashboardStats,
  type DashboardPeriod,
} from "../../services/dashboardService";
import { BarChart, ChartCard, LineChart, PieChart, StatCard } from "./DashboardCharts";
import "./DashboardPage.css";

function money(value: number) {
  return Number(value || 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

export function AdminDashboard() {
  const [period, setPeriod] = useState<DashboardPeriod>("month");
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadStats() {
      try {
        setLoading(true);
        setError("");
        const data = await getAdminDashboard(period);
        if (!ignore) setStats(data);
      } catch {
        if (!ignore) setError("No se pudieron cargar las estadisticas del administrador.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadStats();

    return () => {
      ignore = true;
    };
  }, [period]);

  const conversion = useMemo(() => {
    if (!stats?.summary.users) return 0;
    const managers = stats.usersByType.find((item) => item.label === "organizer");
    return Math.round((Number(managers?.value || 0) / stats.summary.users) * 100);
  }, [stats]);

  return (
    <div className="dash-page">
      <section className="dash-title-row">
        <div>
          <p>Vista general</p>
          <h2>Dashboard administrativo</h2>
          <span>Usuarios, canchas, pagos, reservas y suscripciones de gestores.</span>
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
            <StatCard label="Usuarios totales" value={stats.summary.users} hint={`${conversion}% son gestores`} />
            <StatCard label="Canchas registradas" value={stats.summary.courts} hint="Espacios en la plataforma" />
            <StatCard label="Eventos del periodo" value={stats.summary.events} hint="Reservas y encuentros creados" />
            <StatCard label="Ingresos por eventos" value={money(stats.summary.eventRevenue)} hint="Pagos confirmados" />
            <StatCard
              label="Suscripciones gestores"
              value={money(stats.summary.subscriptionRevenue)}
              hint={`${stats.summary.activeSubscriptions} activas`}
            />
          </section>

          <section className="dash-chart-grid">
            <ChartCard title="Proporcion de usuarios" subtitle="Distribucion por rol">
              <PieChart data={stats.usersByType} />
            </ChartCard>

            <ChartCard title="Estado de canchas" subtitle="Disponibilidad operativa">
              <PieChart data={stats.courtStatus} />
            </ChartCard>

            <ChartCard title="Eventos por dia" subtitle="Actividad del periodo">
              <LineChart data={stats.eventsByDay} />
            </ChartCard>

            <ChartCard title="Top canchas" subtitle="Canchas con mas eventos">
              <BarChart data={stats.topCourts} />
            </ChartCard>

            <ChartCard title="Metodos de pago" subtitle="Pagos confirmados">
              <BarChart data={stats.paymentMethods} />
            </ChartCard>
          </section>
        </>
      )}
    </div>
  );
}
