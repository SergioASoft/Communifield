import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { SubscriptionService } from "../services/subscriptionService";

function getUserId(req: AuthRequest) {
  return Number(req.user?.id || req.user?.id_usuario || req.user?.userId);
}

export class SubscriptionController {
  static async status(req: AuthRequest, res: Response) {
    try {
      const gestorId = getUserId(req);

      if (!gestorId) {
        return res.status(401).json({ message: "No autorizado." });
      }

      const status = await SubscriptionService.getCurrentStatus(gestorId);
      return res.json(status);
    } catch (error: any) {
      return res.status(500).json({
        message: error.message || "Error consultando la suscripción",
      });
    }
  }

  static async createCheckout(req: AuthRequest, res: Response) {
    try {
      const gestorId = getUserId(req);

      if (!gestorId) {
        return res.status(401).json({ message: "No autorizado." });
      }

      const session = await SubscriptionService.createCheckoutSession(
        gestorId,
        req.user?.email
      );

      return res.json({ url: session.url });
    } catch (error: any) {
      return res.status(500).json({
        message: error.message || "Error creando el checkout de Stripe",
      });
    }
  }

  static async confirmCheckout(req: AuthRequest, res: Response) {
    try {
      const gestorId = getUserId(req);
      const { sessionId } = req.body;

      if (!gestorId) {
        return res.status(401).json({ message: "No autorizado." });
      }

      if (!sessionId) {
        return res.status(400).json({ message: "Falta sessionId." });
      }

      const status = await SubscriptionService.confirmCheckoutSession(
        String(sessionId),
        gestorId
      );

      return res.json(status);
    } catch (error: any) {
      return res.status(400).json({
        message: error.message || "No se pudo confirmar el pago",
      });
    }
  }
}
