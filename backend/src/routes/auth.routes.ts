import { Router } from "express";
import { forgotPassword, login, register, me, resetPassword, updateMe, verifyEmail } from "../controllers/auth.controller";
import { requireAuth } from "../middlewares/auth.middleware";

export const authRouter = Router();
authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/verify/:token", verifyEmail);
authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/reset-password", resetPassword);
authRouter.get("/me", requireAuth, me);
authRouter.put("/me", requireAuth, updateMe);

// Preparado para OAuth real. En producción conecta Passport/Google OAuth aquí.
authRouter.get("/google", (_req, res) => res.status(501).json({ message: "OAuth Google pendiente de configurar con Client ID" }));
