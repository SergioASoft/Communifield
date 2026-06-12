import { Request, Response } from "express";
import { env } from "../config/env";
import { SuscripcionGestorService } from "../services/suscripcionGestorService";

const PLAN_MENSUAL_COP = 30000;

function getStripe() {
  if (!env.stripeSecretKey) {
    throw new Error("Falta STRIPE_SECRET_KEY en el archivo .env");
  }

  const Stripe = require("stripe");
  return new Stripe(env.stripeSecretKey);
}

export class SuscripcionGestorController {
  static async getEstado(req: Request, res: Response) {
    try {
      const gestorId = Number(req.params.gestorId);

      if (!gestorId) {
        return res.status(400).json({ message: "ID de gestor inválido" });
      }

      const estado = await SuscripcionGestorService.getEstadoGestor(gestorId);
      return res.json(estado);
    } catch (error: any) {
      return res.status(500).json({
        message: "Error consultando la suscripción",
        detail: error.message,
      });
    }
  }

  static async crearCheckout(req: Request, res: Response) {
    try {
      const gestorId = Number(req.body.gestorId);

      if (!gestorId) {
        return res.status(400).json({ message: "ID de gestor inválido" });
      }

      const stripe = getStripe();

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "cop",
              product_data: {
                name: "Suscripción mensual gestor CommuniField",
                description:
                  "Permite mostrar tus canchas en la plataforma para recibir reservas.",
              },
              unit_amount: PLAN_MENSUAL_COP * 100,
            },
            quantity: 1,
          },
        ],
        metadata: {
          gestorId: String(gestorId),
          plan: "mensual",
        },
        success_url: `${env.frontendUrl}/gestor/mis-canchas?stripe_session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${env.frontendUrl}/gestor/mis-canchas?suscripcion=cancelada`,
      });

      return res.json({ url: session.url });
    } catch (error: any) {
      return res.status(500).json({
        message: "Error creando el pago de Stripe",
        detail: error.message,
      });
    }
  }

  static async confirmarCheckout(req: Request, res: Response) {
    try {
      const sessionId = String(req.body.sessionId || "");

      if (!sessionId) {
        return res.status(400).json({ message: "Falta el sessionId de Stripe" });
      }

      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.payment_status !== "paid") {
        return res.status(400).json({
          message: "El pago todavía no aparece como pagado",
        });
      }

      const gestorId = Number(session.metadata?.gestorId);

      if (!gestorId) {
        return res.status(400).json({
          message: "No se encontró el gestor en la sesión de Stripe",
        });
      }

      const estado = await SuscripcionGestorService.activarSuscripcion({
        gestorId,
        plan: session.metadata?.plan || "mensual",
        precio: PLAN_MENSUAL_COP,
        metodo: "stripe_sandbox",
      });

      return res.json({
        message: "Suscripción activada correctamente",
        suscripcion: estado,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: "Error confirmando el pago de Stripe",
        detail: error.message,
      });
    }
  }
}