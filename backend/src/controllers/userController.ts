import { Request, Response } from 'express';
import { CreateUserDTO } from '../dtos/CreateUserDTO';
import { UpdateUserDTO } from '../dtos/UpdateUserDTO';
import { UserService } from '../services/userService';

export const createUser = async (req: Request, res: Response) => {
  try {
    const data: CreateUserDTO = req.body;
    const newUser = await UserService.createUser(data);

    res.status(201).json({
      message: 'Usuario creado',
      data: newUser,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear usuario' });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 0;
    const limit = parseInt(req.query.limit as string) || 5;
    const result = await UserService.getAllUsers(page, limit);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching users' });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const user = await UserService.getUserById(id);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const data: UpdateUserDTO = req.body;
    const updatedUser = await UserService.updateUser(id, data);

    if (!updatedUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      message: 'Usuario actualizado',
      data: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await UserService.deleteUser(id);

    res.json({
      message: 'Usuario eliminado',
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
};
