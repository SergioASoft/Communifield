import { Router } from "express";
import { CanchaController } from "../controllers/canchacontroller";

const router = Router();

router.get("/", CanchaController.getAll);

router.get("/:id", CanchaController.getById);

export default router;