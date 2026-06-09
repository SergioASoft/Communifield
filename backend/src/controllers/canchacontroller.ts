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
}