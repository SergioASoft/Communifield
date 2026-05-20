import { Router } from "express";
import { login, me } from "../controllers/auth.controller";
import { requireAuth } from "../middlewares/auth.middleware";

export const authRouter = Router();
authRouter.post("/login", login);
authRouter.get("/me", requireAuth, me);

// Preparado para OAuth real. En producción conecta Passport/Google OAuth aquí.
authRouter.get("/google", (_req, res) => res.status(501).json({ message: "OAuth Google pendiente de configurar con Client ID" }));
