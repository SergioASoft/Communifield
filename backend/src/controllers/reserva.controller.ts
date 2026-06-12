import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { addReservaClient } from "../services/reservaRealtime";
import { ReservaService } from "../services/reservaService";

export class ReservaController {
  static async stream(_req: Request, res: Response) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    const removeClient = addReservaClient(res);
    const heartbeat = setInterval(() => {
      res.write(`event: ping\n`);
      res.write(`data: ${JSON.stringify({ at: Date.now() })}\n\n`);
    }, 25000);

    _req.on("close", () => {
      clearInterval(heartbeat);
      removeClient();
    });
  }

  static async disponibilidad(req: Request, res: Response) {
    try {
      const canchaId = Number(req.params.canchaId);
      const fecha = String(req.query.fecha || "");

      if (!canchaId || !fecha) {
        return res.status(400).json({ message: "Cancha y fecha son obligatorias" });
      }

      const reservas = await ReservaService.getDisponibilidad(canchaId, fecha);
      return res.json({ reservas });
    } catch (error: any) {
      return res.status(400).json({
        message: error.message || "No se pudo consultar la disponibilidad",
      });
    }
  }

  static async crearCheckout(req: AuthRequest, res: Response) {
    try {
      const userId = Number(req.user?.id || req.user?.user_id);
      const canchaId = Number(req.params.canchaId);
      const { fecha, hora, duracion } = req.body;

      if (!userId) {
        return res.status(401).json({ message: "Inicia sesion para reservar" });
      }

      const checkout = await ReservaService.crearCheckout({
        canchaId,
        usuarioId: userId,
        fecha: String(fecha || ""),
        hora: String(hora || ""),
        duracion: Number(duracion || 1),
      });

      return res.status(201).json(checkout);
    } catch (error: any) {
      return res.status(409).json({
        message: error.message || "No se pudo iniciar la reserva",
      });
    }
  }

  static async confirmarPago(req: Request, res: Response) {
    try {
      const sessionId = String(req.body.sessionId || "");

      if (!sessionId) {
        return res.status(400).json({ message: "sessionId es obligatorio" });
      }

      const reserva = await ReservaService.confirmarPago(sessionId);
      return res.json({ reserva });
    } catch (error: any) {
      return res.status(400).json({
        message: error.message || "No se pudo confirmar el pago",
      });
    }
  }

  static async cancelarPendiente(req: Request, res: Response) {
    try {
      const eventoId = Number(req.params.eventoId);
      const reserva = await ReservaService.cancelarPendiente(eventoId);
      return res.json({ reserva });
    } catch (error: any) {
      return res.status(400).json({
        message: error.message || "No se pudo cancelar la reserva",
      });
    }
  }
}
