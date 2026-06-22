import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { addReservaClient } from "../services/reservaRealtime";
import { ReservaService } from "../services/reservaService";
import { AppError, getErrorDetails, logError } from "../utils/appError";
import { verifyJwt } from "../utils/jwt";

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
      const token = req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.slice(7)
        : undefined;
      let userId: number | undefined;

      if (token) {
        try {
          const user: any = verifyJwt(token);
          userId = Number(user?.id || user?.user_id) || undefined;
        } catch {
          userId = undefined;
        }
      }

      if (!canchaId || !fecha) {
        return res.status(400).json({ message: "Cancha y fecha son obligatorias" });
      }

      const disponibilidad = await ReservaService.getDisponibilidad(canchaId, fecha, userId);
      return res.json(disponibilidad);
    } catch (error: any) {
      logError("ReservaController.disponibilidad", error, {
        canchaId: req.params.canchaId,
        fecha: req.query.fecha,
      });

      return res.status(500).json({
        message: "No se pudo consultar la disponibilidad",
        code: "AVAILABILITY_ERROR",
        details: getErrorDetails(error),
      });
    }
  }

  static async crearEspacioAbierto(req: AuthRequest, res: Response) {
    const gestorId = Number(req.user?.id || req.user?.user_id);
    const canchaId = Number(req.params.canchaId);
    const { fecha, hora, duracion, participantes } = req.body;

    try {
      if (!gestorId) {
        return res.status(401).json({ message: "Inicia sesion como gestor" });
      }

      const espacioAbierto = await ReservaService.crearEspacioAbierto({
        canchaId,
        gestorId,
        usuarioId: gestorId,
        fecha: String(fecha || ""),
        hora: String(hora || ""),
        duracion: Number(duracion || 1),
        participantes: Number(participantes || 0),
      });

      return res.status(201).json({ espacioAbierto });
    } catch (error: any) {
      const status = error instanceof AppError ? error.status : 500;
      const code = error instanceof AppError ? error.code : "OPEN_SLOT_CREATE_ERROR";
      const details = error instanceof AppError ? error.details : getErrorDetails(error);

      logError("ReservaController.crearEspacioAbierto", error, {
        gestorId,
        canchaId,
        fecha,
        hora,
        duracion,
        participantes,
      });

      return res.status(status).json({
        message: error.message || "No se pudo crear el espacio abierto",
        code,
        details,
      });
    }
  }

  static async unirseEspacioAbierto(req: AuthRequest, res: Response) {
    const userId = Number(req.user?.id || req.user?.user_id);
    const espacioAbiertoId = Number(req.params.espacioAbiertoId);
    const { metodoPago, datosPago } = req.body;

    try {
      if (!userId) {
        return res.status(401).json({ message: "Inicia sesion para unirte" });
      }

      const pago = await ReservaService.unirseEspacioAbierto({
        espacioAbiertoId,
        usuarioId: userId,
        metodoPago: String(metodoPago || ""),
        datosPago: datosPago || {},
      });

      return res.status(201).json(pago);
    } catch (error: any) {
      const status = error instanceof AppError ? error.status : 500;
      const code = error instanceof AppError ? error.code : "OPEN_SLOT_JOIN_ERROR";
      const details = error instanceof AppError ? error.details : getErrorDetails(error);

      logError("ReservaController.unirseEspacioAbierto", error, {
        userId,
        espacioAbiertoId,
        metodoPago,
      });

      return res.status(status).json({
        message: error.message || "No se pudo unirte al espacio abierto",
        code,
        details,
      });
    }
  }

  static async misReservas(req: AuthRequest, res: Response) {
    try {
      const userId = Number(req.user?.id || req.user?.user_id);

      if (!userId) {
        return res.status(401).json({ message: "Inicia sesion para ver tus reservas" });
      }

      const reservas = await ReservaService.getReservasUsuario(userId);
      return res.json({ reservas });
    } catch (error: any) {
      logError("ReservaController.misReservas", error, {
        userId: req.user?.id || req.user?.user_id,
      });

      return res.status(500).json({
        message: "No se pudieron cargar tus reservas",
        code: "USER_RESERVATIONS_ERROR",
        details: getErrorDetails(error),
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

  static async pagarReserva(req: AuthRequest, res: Response) {
    const userId = Number(req.user?.id || req.user?.user_id);
    const canchaId = Number(req.params.canchaId);
    const { fecha, hora, duracion, metodoPago, datosPago } = req.body;

    try {
      if (!userId) {
        return res.status(401).json({ message: "Inicia sesion para reservar" });
      }

      const pago = await ReservaService.pagarReserva({
        canchaId,
        usuarioId: userId,
        fecha: String(fecha || ""),
        hora: String(hora || ""),
        duracion: Number(duracion || 1),
        metodoPago: String(metodoPago || ""),
        datosPago: datosPago || {},
      });

      return res.status(201).json(pago);
    } catch (error: any) {
      const status = error instanceof AppError ? error.status : 500;
      const code = error instanceof AppError ? error.code : "RESERVATION_PAYMENT_ERROR";
      const details = error instanceof AppError ? error.details : getErrorDetails(error);

      logError("ReservaController.pagarReserva", error, {
        userId,
        canchaId,
        fecha,
        hora,
        duracion,
        metodoPago,
      });

      return res.status(status).json({
        message: error.message || "No se pudo completar el pago",
        code,
        details,
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
