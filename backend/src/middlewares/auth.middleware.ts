import { Request, Response, NextFunction } from "express";
import { verifyJwt } from "../utils/jwt";

export interface AuthRequest extends Request { user?: any }

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (!token) return res.status(401).json({ message: "No autorizado. Inicia sesión." });

  try {
    req.user = verifyJwt(token);
    next();
  } catch {
    return res.status(401).json({ message: "Sesión expirada o token inválido." });
  }
}
