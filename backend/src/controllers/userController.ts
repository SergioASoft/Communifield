import { Request, Response } from "express";
import { findUsers } from "../services/userService";
import { User } from "../models/user";

let currentUser: User = {
  id: "1",
  name: "Lissa Ramírez",
  email: "lissa@communifield.com",
  phone: "+57 300 123 4567",
  bio: "Jugadora apasionada del fútbol. Me encanta conocer nuevos equipos y canchas.",
  photo: null,
  favoriteSport: "Fútbol",
  level: "Amateur",
  zone: "Armenia",
  position: "Delantera",
};

export const getUsers = async (req: Request, res: Response) => {
  const users = await findUsers();
  res.json(users);
};

export const getMe = (req: Request, res: Response) => {
  res.json(currentUser);
};

export const updateMe = (req: Request, res: Response) => {
 const { name, phone, bio, photo, favoriteSport, level, zone, position } = req.body ?? {};

  currentUser = {
    ...currentUser,
    name: name ?? currentUser.name,
    phone: phone ?? currentUser.phone,
    bio: bio ?? currentUser.bio,
    photo: photo ?? currentUser.photo,
    favoriteSport: favoriteSport ?? currentUser.favoriteSport,
    level: level ?? currentUser.level,
    zone: zone ?? currentUser.zone,
    position: position ?? currentUser.position,
  };

  res.json({
    message: "Perfil actualizado correctamente",
    user: currentUser,
  });
};