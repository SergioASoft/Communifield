import { Request, Response } from "express";
import { CanchaService } from "../services/canchaservice";
import { AuthRequest } from "../middlewares/auth.middleware";

function getAuthUserId(req: AuthRequest) {
  return Number(req.user?.id || req.user?.user_id || req.user?.id_usuario || 0);
}

function isAdmin(req: AuthRequest) {
  return req.user?.type === "admin" || req.user?.role === "admin";
}

function isOrganizer(req: AuthRequest) {
  return req.user?.type === "organizer" || req.user?.role === "gestor";
}

export class CanchaController {
  static async getAll(_req: Request, res: Response) {
    try {
      const canchas = await CanchaService.getAll();
      res.json(canchas);
    } catch {
      res.status(500).json({ message: "Error obteniendo canchas" });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const cancha = await CanchaService.getById(id);

      if (!cancha) {
        return res.status(404).json({ message: "Cancha no encontrada" });
      }

      res.json(cancha);
    } catch {
      res.status(500).json({ message: "Error obteniendo cancha" });
    }
  }

  static async create(req: AuthRequest, res: Response) {
    try {
      const ownerId = getAuthUserId(req);
      if (!ownerId || (!isOrganizer(req) && !isAdmin(req))) {
        return res.status(403).json({ message: "Solo un gestor puede crear canchas." });
      }

      const payload = { ...req.body };
      payload.owner_id = isAdmin(req) ? req.body.owner_id ?? req.body["fk_id_due\u00f1o"] ?? ownerId : ownerId;
      payload["fk_id_due\u00f1o"] = payload.owner_id;

      const cancha = await CanchaService.create(payload);
      res.status(201).json(cancha);
    } catch {
      res.status(500).json({ message: "Error creando cancha" });
    }
  }

  static async update(req: AuthRequest, res: Response) {
    try {
      const id = Number(req.params.id);
      const ownerId = getAuthUserId(req);
      const cancha = await CanchaService.update(id, req.body, isAdmin(req) ? undefined : ownerId);

      if (!cancha) {
        return res.status(404).json({ message: "Cancha no encontrada" });
      }

      res.json(cancha);
    } catch {
      res.status(500).json({ message: "Error actualizando cancha" });
    }
  }

  static async delete(req: AuthRequest, res: Response) {
    try {
      const id = Number(req.params.id);
      const ownerId = getAuthUserId(req);
      const result = await CanchaService.delete(id, isAdmin(req) ? undefined : ownerId);

      if (!result.found) {
        return res.status(404).json({ message: "Cancha no encontrada" });
      }

      res.json({
        message: result.archived
          ? "La cancha tiene eventos asociados, por eso fue desactivada y retirada de disponibilidad."
          : "Cancha eliminada correctamente",
        ...result,
      });
    } catch {
      res.status(500).json({ message: "Error eliminando cancha" });
    }
  }

  static async getByOwner(req: AuthRequest, res: Response) {
    try {
      const ownerId = Number(req.params.ownerId);
      const authUserId = getAuthUserId(req);

      if (!isAdmin(req) && ownerId !== authUserId) {
        return res.status(403).json({ message: "No puedes consultar canchas de otro gestor." });
      }

      const canchas = await CanchaService.getByOwner(ownerId);
      res.json(canchas);
    } catch {
      res.status(500).json({ message: "Error obteniendo canchas del gestor" });
    }
  }

  static async addReview(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const { estrellas, texto } = req.body;

      if (!estrellas || !texto?.trim()) {
        return res.status(400).json({ message: "La calificacion y el comentario son obligatorios" });
      }

      const cancha = await CanchaService.addReview(id, req.body);

      if (!cancha) {
        return res.status(404).json({ message: "Cancha no encontrada" });
      }

      res.status(201).json(cancha);
    } catch {
      res.status(500).json({ message: "Error guardando resena" });
    }
  }

  static async updateReview(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const index = Number(req.params.index);
      const { texto, estrellas, email } = req.body;

      if (!texto || !String(texto).trim()) {
        return res.status(400).json({ message: "El comentario no puede estar vacio" });
      }

      const canchaActualizada = await CanchaService.updateReview(id, index, {
        texto,
        estrellas,
        email,
      });

      return res.json(canchaActualizada);
    } catch (error: any) {
      return res.status(400).json({ message: error.message || "No se pudo editar la resena" });
    }
  }

  static async deleteReview(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const index = Number(req.params.index);
      const { email } = req.body;

      const canchaActualizada = await CanchaService.deleteReview(id, index, email);

      return res.json(canchaActualizada);
    } catch (error: any) {
      return res.status(400).json({ message: error.message || "No se pudo eliminar la resena" });
    }
  }
}
