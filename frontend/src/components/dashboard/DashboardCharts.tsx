import React from "react";
import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart as RechartsLineChart,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartDatum } from "../../services/dashboardService";
import "./DashboardCharts.css";

const palette = ["#00ab00", "#49d0c1", "#b2d100", "#0e260e", "#65c25d", "#f2b84b"];

function numeric(value: unknown) {
  return Number(value ?? 0);
}

function formatLabel(label: string) {
  if (!label) return "Sin dato";
  if (/^\d{4}-\d{2}-\d{2}$/.test(label)) {
    return new Date(`${label}T00:00:00`).toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "short",
    });
  }

  const labels: Record<string, string> = {
    player: "Jugadores",
    organizer: "Gestores",
    admin: "Admins",
    activo: "Activas",
    inactivo: "Inactivas",
    mantenimiento: "Mantenimiento",
  };

  return labels[label] || label;
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <article className="dash-stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {hint && <p>{hint}</p>}
    </article>
  );
}

export function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="dash-chart-card">
      <div className="dash-chart-header">
        <div>
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export function BarChart({ data, money = false }: { data: ChartDatum[]; money?: boolean }) {
  const normalized = data.map((item) => ({
    label: formatLabel(item.label),
    value: numeric(item.value),
  }));

  if (normalized.length === 0) {
    return <p className="dash-empty">No hay datos para este periodo.</p>;
  }

  return (
    <div className="dash-chart-container dash-chart-container-medium">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={normalized} margin={{ top: 12, right: 18, left: 0, bottom: 8 }}>
          <CartesianGrid vertical={false} stroke="rgba(0, 171, 0, 0.16)" strokeDasharray="4 4" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={12}
            interval={0}
            minTickGap={12}
            stroke="#6e8f6e"
            fontSize={12}
            fontWeight={800}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={money ? 74 : 34}
            stroke="#6e8f6e"
            fontSize={12}
            fontWeight={800}
            tickFormatter={(value) =>
              money
                ? Number(value).toLocaleString("es-CO", {
                    notation: "compact",
                    maximumFractionDigits: 1,
                  })
                : Number(value).toLocaleString("es-CO")
            }
          />
          <Tooltip
            cursor={{ fill: "rgba(0, 171, 0, 0.08)" }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const value = Number(payload[0].value || 0);

              return (
                <div className="dash-chart-tooltip">
                  <p>{label}</p>
                  <div>
                    <span />
                    <strong>
                      {money
                        ? value.toLocaleString("es-CO", {
                            style: "currency",
                            currency: "COP",
                            maximumFractionDigits: 0,
                          })
                        : value.toLocaleString("es-CO")}
                    </strong>
                  </div>
                </div>
              );
            }}
          />
          <Bar dataKey="value" radius={[7, 7, 0, 0]}>
            {normalized.map((_, index) => (
              <Cell key={`bar-${index}`} fill={palette[index % palette.length]} />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PieChart({ data }: { data: ChartDatum[] }) {
  const normalized = data
    .map((item) => ({ label: formatLabel(item.label), value: numeric(item.value) }))
    .filter((item) => item.value > 0);
  const total = normalized.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return <p className="dash-empty">No hay datos para este periodo.</p>;
  }

  return (
    <div className="dash-pie-layout dash-chart-container">
      <div className="dash-pie-chart">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const item = payload[0].payload as { label: string; value: number };

                return (
                  <div className="dash-chart-tooltip">
                    <p>{item.label}</p>
                    <div>
                      <span />
                      <strong>{Math.round((item.value / total) * 100)}%</strong>
                    </div>
                  </div>
                );
              }}
            />
            <Pie
              data={normalized}
              dataKey="value"
              nameKey="label"
              innerRadius="58%"
              outerRadius="86%"
              paddingAngle={3}
              stroke="#ffffff"
              strokeWidth={3}
            >
              {normalized.map((_, index) => (
                <Cell key={`pie-${index}`} fill={palette[index % palette.length]} />
              ))}
            </Pie>
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
      <div className="dash-legend">
        {normalized.map((item, index) => (
          <div key={`${item.label}-${index}`}>
            <span style={{ background: palette[index % palette.length] }} />
            <p>{item.label}</p>
            <strong>{Math.round((item.value / total) * 100)}%</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LineChart({ data }: { data: ChartDatum[] }) {
  const normalized = data.map((item) => ({
    label: formatLabel(item.label),
    rawLabel: item.label,
    value: numeric(item.value),
  }));

  if (normalized.length === 0) {
    return <p className="dash-empty">No hay datos para este periodo.</p>;
  }

  return (
    <div className="dash-chart-container dash-chart-container-tall">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart
          accessibilityLayer
          data={normalized}
          margin={{ top: 18, right: 22, left: 4, bottom: 8 }}
        >
          <CartesianGrid vertical={false} stroke="rgba(0, 171, 0, 0.16)" strokeDasharray="4 4" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={12}
            interval="preserveStartEnd"
            minTickGap={24}
            stroke="#6e8f6e"
            fontSize={12}
            fontWeight={800}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={28}
            stroke="#6e8f6e"
            fontSize={12}
            fontWeight={800}
          />
          <Tooltip
            cursor={{ stroke: "rgba(0, 171, 0, 0.22)", strokeWidth: 2 }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;

              return (
                <div className="dash-chart-tooltip">
                  <p>{label}</p>
                  <div>
                    <span />
                    <strong>{Number(payload[0].value || 0).toLocaleString("es-CO")} eventos</strong>
                  </div>
                </div>
              );
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#00ab00"
            strokeWidth={3}
            dot={{ r: 4, fill: "#49d0c1", stroke: "#ffffff", strokeWidth: 2 }}
            activeDot={{ r: 6, fill: "#00ab00", stroke: "#ffffff", strokeWidth: 3 }}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}
