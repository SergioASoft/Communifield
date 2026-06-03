import { Request, Response } from "express";
import { env } from "../config/env";

type AssistantMessage = {
  role: "user" | "assistant";
  content: string;
};

type AssistantRequestBody = {
  message?: string;
  conversation?: AssistantMessage[];
};

export async function chatWithAdminAssistant(req: Request<unknown, unknown, AssistantRequestBody>, res: Response) {
  const message = req.body.message?.trim();

  if (!message) {
    return res.status(400).json({ message: "Escribe una consulta para el asistente." });
  }

  try {
    const response = await fetch(`${env.aiAgentUrl}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        conversation: req.body.conversation ?? [],
        user: (req as any).user ?? null,
        channel: "admin",
      }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      return res.status(response.status).json({
        message: payload.message ?? "El asistente no pudo procesar la consulta.",
      });
    }

    return res.json(payload);
  } catch {
    return res.status(503).json({
      message: "El servicio Python del asistente no esta disponible. Inicia `npm run agent` en el backend.",
    });
  }
}
