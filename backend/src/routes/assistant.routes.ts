import { Router } from "express";
import { chatWithAdminAssistant } from "../controllers/assistant.controller";
import { requireAuth } from "../middlewares/auth.middleware";

export const assistantRouter = Router();

assistantRouter.post("/admin/chat", requireAuth, chatWithAdminAssistant);
