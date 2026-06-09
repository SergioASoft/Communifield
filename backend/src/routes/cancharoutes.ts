import { Router } from "express";
import { CanchaController } from "../controllers/canchacontroller";

const router = Router();

router.get("/", CanchaController.getAll);
router.get("/:id", CanchaController.getById);
router.post("/", CanchaController.create);
router.put("/:id", CanchaController.update);
router.delete("/:id", CanchaController.delete);

export default router;