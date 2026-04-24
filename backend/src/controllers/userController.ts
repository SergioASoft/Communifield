import { Request, Response } from 'express';
import { UserService } from '../services/userService';
import { CreateUserDTO } from '../dtos/CreateUserDTO';
import { UpdateUserDTO } from '../dtos/UpdateUserDTO';

export const createUser = async (req: Request, res: Response) => {
  try {
    const data: CreateUserDTO = req.body;

    const newUser = await UserService.createUser(data);

    res.status(201).json({
      message: "Usuario creado",
      data: newUser
    });
  } catch (error) {
    res.status(500).json({ error: "Error al crear usuario" });
  }
};

export const getAllUsers = async (_req: Request, res: Response) => {
  try {
    const users = await UserService.getAllUsers();

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const user = await UserService.getUserById(id);

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener usuario" });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const data: UpdateUserDTO = req.body;

    const result = await UserService.updateUser(id, data);

    res.json({
      message: "Usuario actualizado",
      result
    });
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar usuario" });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const result = await UserService.deleteUser(id);

    res.json({
      message: "Usuario eliminado",
      result
    });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar usuario" });
  }
};