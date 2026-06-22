import { Router } from "express";
import { ReservaController } from "../controllers/reserva.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

router.get("/stream", ReservaController.stream);
router.get("/mis-reservas", requireAuth, ReservaController.misReservas);
router.get("/canchas/:canchaId/disponibilidad", ReservaController.disponibilidad);
router.post(
  "/canchas/:canchaId/espacios-abiertos",
  requireAuth,
  ReservaController.crearEspacioAbierto
);
router.post(
  "/espacios-abiertos/:espacioAbiertoId/unirse",
  requireAuth,
  ReservaController.unirseEspacioAbierto
);
router.post(
  "/canchas/:canchaId/checkout",
  requireAuth,
  ReservaController.crearCheckout
);
router.post(
  "/canchas/:canchaId/pagar",
  requireAuth,
  ReservaController.pagarReserva
);
router.post("/confirmar", ReservaController.confirmarPago);
router.post("/cancelar/:eventoId", ReservaController.cancelarPendiente);

export default router;
