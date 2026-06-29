import { Router } from "express";
import { CanchaController } from "../controllers/canchacontroller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", CanchaController.getAll);

router.get("/gestor/:ownerId", requireAuth, CanchaController.getByOwner);
router.put("/:id/reviews/:index", CanchaController.updateReview);
router.delete("/:id/reviews/:index", CanchaController.deleteReview);
router.post("/", requireAuth, CanchaController.create);
router.post("/:id/reviews", CanchaController.addReview);
router.get("/:id", CanchaController.getById);
router.put("/:id", requireAuth, CanchaController.update);
router.delete("/:id", requireAuth, CanchaController.delete);
router.put("/:id/reviews/:index", CanchaController.updateReview);
router.delete("/:id/reviews/:index", CanchaController.deleteReview);
export default router;
