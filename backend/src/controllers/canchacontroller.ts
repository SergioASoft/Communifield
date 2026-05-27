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
}