import { Request, Response } from "express";
import { FriendService } from "../services/friendservice";

export class FriendController {
  static async getFriends(req: Request, res: Response) {
    try {
      const userId = Number(req.params.userId);

      if (!userId) {
        return res.status(400).json({
          message: "ID de usuario inválido",
        });
      }

      const friends = await FriendService.getFriends(userId);

      res.json(friends);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Error obteniendo amigos",
      });
    }
  }

  static async searchUsers(req: Request, res: Response) {
    try {
      const userId = Number(req.params.userId);
      const q = String(req.query.q || "").trim();

      if (!userId) {
        return res.status(400).json({
          message: "ID de usuario inválido",
        });
      }

      if (!q) {
        return res.json([]);
      }

      const users = await FriendService.searchUsers(userId, q);

      res.json(users);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Error buscando usuarios",
      });
    }
  }

  static async getRequests(req: Request, res: Response) {
    try {
      const userId = Number(req.params.userId);

      if (!userId) {
        return res.status(400).json({
          message: "ID de usuario inválido",
        });
      }

      const requests = await FriendService.getRequests(userId);

      res.json(requests);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Error obteniendo solicitudes",
      });
    }
  }

  static async addFriend(req: Request, res: Response) {
    try {
      const userId = Number(req.body.userId);
      const friendId = Number(req.body.friendId);

      if (!userId || !friendId) {
        return res.status(400).json({
          message: "Datos incompletos",
        });
      }

      if (userId === friendId) {
        return res.status(400).json({
          message: "No puedes agregarte a ti mismo",
        });
      }

      await FriendService.addFriend(userId, friendId);

      res.json({
        message: "Solicitud enviada correctamente",
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Error enviando solicitud",
      });
    }
  }

  static async acceptRequest(req: Request, res: Response) {
    try {
      const requestId = Number(req.params.requestId);
      const userId = Number(req.body.userId);

      if (!requestId || !userId) {
        return res.status(400).json({
          message: "Datos incompletos",
        });
      }

      await FriendService.acceptRequest(requestId, userId);

      res.json({
        message: "Solicitud aceptada",
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Error aceptando solicitud",
      });
    }
  }

  static async rejectRequest(req: Request, res: Response) {
    try {
      const requestId = Number(req.params.requestId);
      const userId = Number(req.body.userId);

      if (!requestId || !userId) {
        return res.status(400).json({
          message: "Datos incompletos",
        });
      }

      await FriendService.rejectRequest(requestId, userId);

      res.json({
        message: "Solicitud rechazada",
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Error rechazando solicitud",
      });
    }
  }
  static async cancelRequest(req: Request, res: Response) {
  try {
    const requestId = Number(req.params.requestId);
    const userId = Number(req.body.userId);

    if (!requestId || !userId) {
      return res.status(400).json({
        message: "Datos incompletos",
      });
    }

    await FriendService.cancelRequest(requestId, userId);

    res.json({
      message: "Solicitud cancelada",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error cancelando solicitud",
    });
  }
}
static async deleteFriend(req: Request, res: Response) {
  try {
    const friendshipId = Number(req.params.friendshipId);
    const userId = Number(req.body.userId);

    if (!friendshipId || !userId) {
      return res.status(400).json({
        message: "Datos incompletos",
      });
    }

    await FriendService.deleteFriend(friendshipId, userId);

    res.json({
      message: "Amigo eliminado correctamente",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error eliminando amigo",
    });
  }
}
}