import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { DashboardService } from "../services/dashboardService";

function isAdmin(user: any) {
  return user?.type === "admin" || user?.role === "admin";
}

function isManager(user: any) {
  return user?.type === "organizer" || user?.role === "gestor";
}

function userId(user: any) {
  return Number(user?.id || user?.user_id || user?.id_usuario);
}

export class DashboardController {
  static async admin(req: AuthRequest, res: Response) {
    try {
      if (!isAdmin(req.user)) {
        return res.status(403).json({ message: "No tienes permisos de administrador." });
      }

      const stats = await DashboardService.getAdminStats(String(req.query.period || "month"));
      return res.json(stats);
    } catch (error) {
      return res.status(500).json({ message: "Error obteniendo estadisticas del administrador" });
    }
  }

  static async manager(req: AuthRequest, res: Response) {
    try {
      if (!isManager(req.user) && !isAdmin(req.user)) {
        return res.status(403).json({ message: "No tienes permisos de gestor." });
      }

      const ownerId = Number(req.query.ownerId || userId(req.user));

      if (!ownerId) {
        return res.status(400).json({ message: "No se pudo identificar el gestor." });
      }

      if (!isAdmin(req.user) && ownerId !== userId(req.user)) {
        return res.status(403).json({ message: "No puedes consultar estadisticas de otro gestor." });
      }

      const stats = await DashboardService.getManagerStats(ownerId, String(req.query.period || "month"));
      return res.json(stats);
    } catch (error) {
      return res.status(500).json({ message: "Error obteniendo estadisticas del gestor" });
    }
  }
}
