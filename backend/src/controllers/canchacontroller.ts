import { Request, Response } from "express";
import { CanchaService } from "../services/canchaservice";

export class CanchaController {
  static async getAll(_req: Request, res: Response) {
    try {
      const canchas = await CanchaService.getAll();
      res.json(canchas);
    } catch (error) {
      res.status(500).json({
        message: "Error obteniendo canchas",
      });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const cancha = await CanchaService.getById(id);

      if (!cancha) {
        return res.status(404).json({
          message: "Cancha no encontrada",
        });
      }

      res.json(cancha);
    } catch (error) {
      res.status(500).json({
        message: "Error obteniendo cancha",
      });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const cancha = await CanchaService.create(req.body);
      res.status(201).json(cancha);
    } catch (error) {
      res.status(500).json({
        message: "Error creando cancha",
      });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const cancha = await CanchaService.update(id, req.body);

      if (!cancha) {
        return res.status(404).json({
          message: "Cancha no encontrada",
        });
      }

      res.json(cancha);
    } catch (error) {
      res.status(500).json({
        message: "Error actualizando cancha",
      });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      await CanchaService.delete(id);

      res.json({
        message: "Cancha eliminada correctamente",
      });
    } catch (error) {
      res.status(500).json({
        message: "Error eliminando cancha",
      });
    }
    
  }
  static async getByOwner(req: Request, res: Response) {
  try {
    const ownerId = Number(req.params.ownerId);

    const canchas = await CanchaService.getByOwner(ownerId);

    res.json(canchas);
  } catch (error) {
    res.status(500).json({
      message: "Error obteniendo canchas del gestor",
    });
  }
}
static async addReview(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const { estrellas, texto } = req.body;

    if (!estrellas || !texto?.trim()) {
      return res.status(400).json({
        message: "La calificación y el comentario son obligatorios",
      });
    }

    const cancha = await CanchaService.addReview(id, req.body);

    if (!cancha) {
      return res.status(404).json({
        message: "Cancha no encontrada",
      });
    }

    res.status(201).json(cancha);
  } catch (error) {
    res.status(500).json({
      message: "Error guardando reseña",
    });
  }
}
static async updateReview(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const index = Number(req.params.index);

    const { texto, estrellas, email } = req.body;

    if (!texto || !String(texto).trim()) {
      return res.status(400).json({
        message: "El comentario no puede estar vacío",
      });
    }

    const canchaActualizada = await CanchaService.updateReview(
      id,
      index,
      {
        texto,
        estrellas,
        email,
      }
    );

    return res.json(canchaActualizada);
  } catch (error: any) {
    return res.status(400).json({
      message: error.message || "No se pudo editar la reseña",
    });
  }
}

static async deleteReview(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const index = Number(req.params.index);

    const { email } = req.body;

    const canchaActualizada = await CanchaService.deleteReview(
      id,
      index,
      email
    );

    return res.json(canchaActualizada);
  } catch (error: any) {
    return res.status(400).json({
      message: error.message || "No se pudo eliminar la reseña",
    });
  }
}
}