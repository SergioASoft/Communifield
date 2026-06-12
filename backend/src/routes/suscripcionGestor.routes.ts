import { Router } from "express";
import { SuscripcionGestorController } from "../controllers/suscripcionGestorController";

const router = Router();

router.get("/gestor/:gestorId", SuscripcionGestorController.getEstado);
router.post("/checkout", SuscripcionGestorController.crearCheckout);
router.post("/confirmar-checkout", SuscripcionGestorController.confirmarCheckout);

export default router;