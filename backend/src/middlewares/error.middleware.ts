import { Request, Response, NextFunction } from "express";

export function notFound(req: Request, res: Response) {
  res.status(404).json({ message: "Ruta no encontrada" });
}

export function errorHandler(error: any, _req: Request, res: Response, _next: NextFunction) {
  console.error(error);
  res.status(error.status || 500).json({ message: error.message || "Error interno del servidor" });
}
