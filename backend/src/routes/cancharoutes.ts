import { Router } from "express";
import { CanchaController } from "../controllers/canchacontroller";

const router = Router();

router.get("/", CanchaController.getAll);

router.get("/gestor/:ownerId", CanchaController.getByOwner);
router.put("/:id/reviews/:index", CanchaController.updateReview);
router.delete("/:id/reviews/:index", CanchaController.deleteReview);
router.post("/", CanchaController.create);
router.post("/:id/reviews", CanchaController.addReview);
router.get("/:id", CanchaController.getById);
router.put("/:id", CanchaController.update);
router.delete("/:id", CanchaController.delete);
router.put("/:id/reviews/:index", CanchaController.updateReview);
router.delete("/:id/reviews/:index", CanchaController.deleteReview);
export default router;