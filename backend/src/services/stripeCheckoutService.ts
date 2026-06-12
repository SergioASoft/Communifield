import { env } from "../config/env";

type StripeSessionRequest = {
  canchaId: number;
  eventoId: number;
  nombreCancha: string;
  total: number;
};

type StripeSessionResponse = {
  id: string;
  url: string;
  expiresAt?: number;
  mock: boolean;
};

function buildReturnUrl(path: string) {
  return `${env.frontendUrl}${path}`;
}

export class StripeCheckoutService {
  static isConfigured() {
    return Boolean(env.stripe.secretKey);
  }

  static async createSession(data: StripeSessionRequest): Promise<StripeSessionResponse> {
    const successUrl = buildReturnUrl(
      `/canchas/${data.canchaId}?reserva=success&session_id={CHECKOUT_SESSION_ID}`
    );
    const cancelUrl = buildReturnUrl(
      `/canchas/${data.canchaId}?reserva=cancelada&eventoId=${data.eventoId}`
    );

    if (!this.isConfigured()) {
      return {
        id: `mock_${data.eventoId}`,
        url: successUrl.replace("{CHECKOUT_SESSION_ID}", `mock_${data.eventoId}`),
        mock: true,
      };
    }

    const params = new URLSearchParams();
    params.set("mode", "payment");
    params.set("success_url", successUrl);
    params.set("cancel_url", cancelUrl);
    params.set("payment_method_types[0]", "card");
    params.set("line_items[0][quantity]", "1");
    params.set("line_items[0][price_data][currency]", env.stripe.currency);
    params.set(
      "line_items[0][price_data][unit_amount]",
      String(Math.round(data.total))
    );
    params.set(
      "line_items[0][price_data][product_data][name]",
      `Reserva ${data.nombreCancha}`
    );
    params.set("metadata[eventoId]", String(data.eventoId));
    params.set("metadata[canchaId]", String(data.canchaId));
    params.set(
      "expires_at",
      String(Math.floor(Date.now() / 1000) + env.stripe.checkoutTtlMinutes * 60)
    );

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.stripe.secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    const session: any = await response.json();

    if (!response.ok) {
      throw new Error(session?.error?.message || "No se pudo crear la sesion de Stripe");
    }

    return {
      id: session.id,
      url: session.url,
      expiresAt: session.expires_at,
      mock: false,
    };
  }

  static async getSession(sessionId: string) {
    if (sessionId.startsWith("mock_")) {
      return {
        id: sessionId,
        payment_status: "paid",
        metadata: {
          eventoId: sessionId.replace("mock_", ""),
        },
      };
    }

    if (!this.isConfigured()) {
      throw new Error("Stripe no esta configurado");
    }

    const response = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
      {
        headers: {
          Authorization: `Bearer ${env.stripe.secretKey}`,
        },
      }
    );

    const session: any = await response.json();

    if (!response.ok) {
      throw new Error(session?.error?.message || "No se pudo consultar Stripe");
    }

    return session;
  }
}
