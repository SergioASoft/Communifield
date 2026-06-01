import { Router } from "express";
import { login, me, updateMe } from "../controllers/auth.controller";
import { requireAuth } from "../middlewares/auth.middleware";

export const authRouter = Router();
authRouter.post("/login", login);
authRouter.get("/me", requireAuth, me);
authRouter.put("/me", requireAuth, updateMe);

// Preparado para OAuth real. En producción conecta Passport/Google OAuth aquí.
authRouter.get("/google", (_req, res) => res.status(501).json({ message: "OAuth Google pendiente de configurar con Client ID" }));
