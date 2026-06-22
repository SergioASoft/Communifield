import { api } from "./api";

export type DashboardPeriod = "today" | "week" | "month" | "all";

export type ChartDatum = {
  label: string;
  value: number | string;
  total?: number | string;
};

export type AdminDashboardStats = {
  period: DashboardPeriod;
  summary: {
    users: number;
    courts: number;
    events: number;
    eventRevenue: number;
    subscriptionRevenue: number;
    activeSubscriptions: number;
  };
  usersByType: ChartDatum[];
  courtStatus: ChartDatum[];
  paymentMethods: ChartDatum[];
  eventsByDay: ChartDatum[];
  topCourts: ChartDatum[];
};

export type ManagerDashboardStats = {
  period: DashboardPeriod;
  summary: {
    courts: number;
    events: number;
    revenue: number;
    averageRating: number;
    totalReviews: number;
  };
  courtsByStatus: ChartDatum[];
  eventsByCourt: ChartDatum[];
  revenueByCourt: ChartDatum[];
  eventsByDay: ChartDatum[];
  paymentMethods: ChartDatum[];
  upcomingEvents: Array<{
    id_evento: number;
    courtName: string;
    startsAt: string;
    endsAt: string;
    maxPlayers: number;
  }>;
};

export const periodOptions: Array<{ value: DashboardPeriod; label: string }> = [
  { value: "today", label: "Hoy" },
  { value: "week", label: "Ultima semana" },
  { value: "month", label: "Ultimo mes" },
  { value: "all", label: "Todo" },
];

export async function getAdminDashboard(period: DashboardPeriod) {
  const { data } = await api.get<AdminDashboardStats>("/api/dashboard/admin", {
    params: { period },
  });

  return data;
}

export async function getManagerDashboard(period: DashboardPeriod, ownerId?: number) {
  const { data } = await api.get<ManagerDashboardStats>("/api/dashboard/manager", {
    params: { period, ownerId },
  });

  return data;
}
