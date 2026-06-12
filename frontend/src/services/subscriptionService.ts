import { api } from "./api";

export type GestorSubscriptionStatus = {
  estado: "sin_suscripcion" | "activa" | "vencida" | "cancelada";
  activa: boolean;
  suscripcion: any | null;
};

export const subscriptionService = {
  async getStatus() {
    const { data } = await api.get<GestorSubscriptionStatus>("/api/subscriptions/status");
    return data;
  },

  async createCheckout() {
    const { data } = await api.post<{ url: string }>("/api/subscriptions/checkout", {});
    return data;
  },

  async confirmCheckout(sessionId: string) {
    const { data } = await api.post<GestorSubscriptionStatus>("/api/subscriptions/confirm", {
      sessionId,
    });
    return data;
  },
};
