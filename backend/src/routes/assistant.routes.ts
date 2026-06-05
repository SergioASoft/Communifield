import { Router } from "express";
import { chatWithAssistant } from "../controllers/assistant.controller";
import { requireAuth } from "../middlewares/auth.middleware";

export const assistantRouter = Router();

assistantRouter.post("/admin/chat", requireAuth, chatWithAssistant);
assistantRouter.post("/manager/chat", requireAuth, chatWithAssistant);
