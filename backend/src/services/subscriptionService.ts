import Stripe from "stripe";
import { pool } from "../config/db";
import { env } from "../config/env";

const stripe = env.stripe.secretKey
  ? new Stripe(env.stripe.secretKey)
  : null;

export type SubscriptionStatus = "sin_suscripcion" | "activa" | "vencida" | "cancelada";

export class SubscriptionService {
  static async getCurrentStatus(gestorId: number) {
    const [rows]: any = await pool.query(
      `
      SELECT *
      FROM SUSCRIPCION_GESTOR
      WHERE fk_id_gestor = ?
      ORDER BY
        CASE estado
          WHEN 'activa' THEN 1
          WHEN 'vencida' THEN 2
          WHEN 'cancelada' THEN 3
          ELSE 4
        END,
        fecha_inicio DESC
      LIMIT 1
      `,
      [gestorId]
    );

    const subscription = rows[0];

    if (!subscription) {
      return {
        estado: "sin_suscripcion" as SubscriptionStatus,
        activa: false,
        suscripcion: null,
      };
    }

    const vencidaPorFecha =
      subscription.fecha_fin && new Date(subscription.fecha_fin).getTime() < Date.now();

    if (subscription.estado === "activa" && !vencidaPorFecha) {
      return {
        estado: "activa" as SubscriptionStatus,
        activa: true,
        suscripcion: subscription,
      };
    }

    if (subscription.estado === "activa" && vencidaPorFecha) {
      await pool.query(
        `UPDATE SUSCRIPCION_GESTOR SET estado = 'vencida' WHERE id_suscripcion = ?`,
        [subscription.id_suscripcion]
      );

      return {
        estado: "vencida" as SubscriptionStatus,
        activa: false,
        suscripcion: { ...subscription, estado: "vencida" },
      };
    }

    return {
      estado: subscription.estado as SubscriptionStatus,
      activa: false,
      suscripcion: subscription,
    };
  }

  static async createCheckoutSession(gestorId: number, email?: string) {
    if (!stripe) {
      throw new Error("Stripe no está configurado. Revisa STRIPE_SECRET_KEY.");
    }

    if (!env.stripe.monthlyPriceId) {
      throw new Error("Falta STRIPE_MONTHLY_PRICE_ID en el .env.");
    }

    const successUrl = `${env.frontendUrl}/gestor/suscripcion/exito?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${env.frontendUrl}/gestor/dashboard`;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [
        {
          price: env.stripe.monthlyPriceId,
          quantity: 1,
        },
      ],
      metadata: {
        gestorId: String(gestorId),
      },
      subscription_data: {
        metadata: {
          gestorId: String(gestorId),
        },
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return session;
  }

  static async confirmCheckoutSession(sessionId: string, gestorId: number) {
    if (!stripe) {
      throw new Error("Stripe no está configurado. Revisa STRIPE_SECRET_KEY.");
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    const sessionGestorId = Number(session.metadata?.gestorId);

    if (sessionGestorId !== gestorId) {
      throw new Error("La sesión de pago no pertenece a este gestor.");
    }

    if (session.payment_status !== "paid") {
      throw new Error("El pago aún no está confirmado.");
    }

    const stripeSubscription: any = session.subscription;
    const currentPeriodEnd = stripeSubscription?.current_period_end
      ? new Date(stripeSubscription.current_period_end * 1000)
      : null;

    const [existing]: any = await pool.query(
      `
      SELECT id_suscripcion
      FROM SUSCRIPCION_GESTOR
      WHERE fk_id_gestor = ? AND estado = 'activa'
      ORDER BY fecha_inicio DESC
      LIMIT 1
      `,
      [gestorId]
    );

    let subscriptionId: number;

    if (existing[0]) {
      subscriptionId = existing[0].id_suscripcion;
      await pool.query(
        `
        UPDATE SUSCRIPCION_GESTOR
        SET plan = 'mensual',
            precio = ?,
            estado = 'activa',
            fecha_fin = ?
        WHERE id_suscripcion = ?
        `,
        [Number(session.amount_total || 0) / 100, currentPeriodEnd, subscriptionId]
      );
    } else {
      const [created]: any = await pool.query(
        `
        INSERT INTO SUSCRIPCION_GESTOR (fk_id_gestor, plan, precio, estado, fecha_fin)
        VALUES (?, 'mensual', ?, 'activa', ?)
        `,
        [gestorId, Number(session.amount_total || 0) / 100, currentPeriodEnd]
      );
      subscriptionId = created.insertId;
    }

    await pool.query(
      `
      INSERT INTO PAGO_SUSCRIPCION (fk_id_suscripcion, total, metodo, estado)
      VALUES (?, ?, 'stripe', 'pagado')
      `,
      [subscriptionId, Number(session.amount_total || 0) / 100]
    );

    return this.getCurrentStatus(gestorId);
  }
}
