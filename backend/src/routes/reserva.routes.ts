import { Router } from "express";
import { ReservaController } from "../controllers/reserva.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

router.get("/stream", ReservaController.stream);
router.get("/canchas/:canchaId/disponibilidad", ReservaController.disponibilidad);
router.post(
  "/canchas/:canchaId/checkout",
  requireAuth,
  ReservaController.crearCheckout
);
router.post("/confirmar", ReservaController.confirmarPago);
router.post("/cancelar/:eventoId", ReservaController.cancelarPendiente);

export default router;
