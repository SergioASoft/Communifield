import { Request, Response } from "express";
import { RowDataPacket } from "mysql2";
import { pool } from "../config/db";
import { env } from "../config/env";
import { comparePassword } from "../utils/password";
import { signToken } from "../utils/jwt";
import { loginSchema, registerSchema } from "../utils/validators";
import { UserType } from "../models/user";
import { UpdateUserDTO } from "../dtos/UpdateUserDTO";
import { UserService } from "../services/userService";

type UserRow = RowDataPacket & {
  user_id: number;
  id_usuario: number;
  name: string;
  nombre: string;
  email: string;
  phone: string | null;
  tel: string | null;
  bio: string | null;
  biografia: string | null;
  photo: string | null;
  foto: string | null;
  position: string | null;
  posicion: string | null;
  password_hash: string;
  type: UserType;
  Tipo: UserType;
  fk_id_evento: number | null;
};

const userColumns = `
  id_usuario AS user_id,
  id_usuario,
  nombre AS name,
  nombre,
  email,
  \`contraseña_hash\` AS password_hash,
  \`contraseña_hash\`,
  tel AS phone,
  tel,
  biografia AS bio,
  biografia,
  foto AS photo,
  foto,
  posicion AS position,
  posicion,
  Tipo AS type,
  Tipo,
  fk_id_evento
`;

const roleFromType = (type: UserType) => {
  if (type === "organizer") return "gestor";
  return type;
};

const redirectFromType = (type: UserType) => (type === "admin" ? "/usuarios" : "/canchas");

const publicUser = (user: UserRow) => ({
  id: user.user_id,
  user_id: user.user_id,
  id_usuario: user.id_usuario,
  name: user.name,
  nombre: user.nombre,
  email: user.email,
  phone: user.phone,
  tel: user.tel,
  bio: user.bio,
  biografia: user.biografia,
  photo: user.photo,
  foto: user.foto,
  position: user.position,
  posicion: user.posicion,
  type: user.type,
  Tipo: user.Tipo,
  fk_id_evento: user.fk_id_evento,
  role: roleFromType(user.type),
  redirectTo: redirectFromType(user.type),
});

export async function register(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Datos invalidos", errors: parsed.error.flatten().fieldErrors });
  }

  const { name, email, phone, password, type, bio, photo, position, photoFile } = parsed.data;
  const [exists] = await pool.query<UserRow[]>(
    "SELECT id_usuario AS user_id, email, tel AS phone FROM USUARIO WHERE email = ? LIMIT 1",
    [email]
  );

  if (exists.length) {
    const errors: Record<string, string[]> = {};
    errors.email = ["Este correo ya esta registrado"];
    return res.status(409).json({ message: "Usuario duplicado", errors });
  }

  const newUser = await UserService.createUser({ name, email, phone, password, type, bio, photo, photoFile, position });

  return res.status(201).json({ message: "Registro exitoso", userId: newUser?.user_id });
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Datos invalidos", errors: parsed.error.flatten().fieldErrors });
  }

  const { email, password } = parsed.data;
  const [rows] = await pool.query<UserRow[]>(`SELECT ${userColumns} FROM USUARIO WHERE email = ? LIMIT 1`, [email]);
  const user = rows[0];
  if (!user || !user.password_hash) return res.status(401).json({ message: "Correo o contrasena incorrectos" });

  const validPassword = await comparePassword(password, user.password_hash);
  if (!validPassword) {
    return res.status(401).json({ message: "Correo o contraseña incorrectos" });
  }

  const tokenUser = { id: user.user_id, user_id: user.user_id, email: user.email, type: user.type, role: roleFromType(user.type) };
  const token = signToken(tokenUser);
  const publicData = publicUser(user);

  return res.json({
    message: "Inicio de sesion exitoso",
    token,
    user: publicData,
    redirectTo: publicData.redirectTo,
    expiresIn: env.jwtExpiresIn,
  });
}

export async function me(req: Request, res: Response) {
  const authUser = (req as any).user;
  const [rows] = await pool.query<UserRow[]>(`SELECT ${userColumns} FROM USUARIO WHERE id_usuario = ? LIMIT 1`, [authUser.id]);
  if (!rows[0]) return res.status(404).json({ message: "Usuario no encontrado" });
  res.json({ user: publicUser(rows[0]) });
}

export async function updateMe(req: Request, res: Response) {
  const authUser = (req as any).user;
  const data: UpdateUserDTO = req.body;
  const updatedUser = await UserService.updateUser(authUser.id, data);

  if (!updatedUser) return res.status(404).json({ message: "Usuario no encontrado" });
  const user = updatedUser as any;
  const enrichedUser = {
    ...user,
    role: roleFromType(user.type),
    redirectTo: redirectFromType(user.type),
  };
  res.json({ message: "Perfil actualizado", user: enrichedUser, data: enrichedUser });
}
