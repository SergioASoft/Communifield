import { Request, Response } from "express";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/db";
import { env } from "../config/env";
import { comparePassword, hashPassword } from "../utils/password";
import { signToken } from "../utils/jwt";
import { loginSchema, registerSchema } from "../utils/validators";
import { UserType } from "../models/user";

type UserRow = RowDataPacket & {
  user_id: number;
  name: string;
  email: string;
  phone: string | null;
  password_hash: string;
  type: UserType;
  created_at: Date;
};

const roleFromType = (type: UserType) => {
  if (type === "organizer") return "gestor";
  return type;
};

const redirectFromType = (type: UserType) => (type === "admin" ? "/usuarios" : "/canchas");

const publicUser = (user: UserRow) => ({
  id: user.user_id,
  user_id: user.user_id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  type: user.type,
  role: roleFromType(user.type),
  redirectTo: redirectFromType(user.type),
});

export async function register(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Datos invalidos", errors: parsed.error.flatten().fieldErrors });
  }

  const { name, email, phone, password, type } = parsed.data;
  const [exists] = await pool.query<UserRow[]>(
    "SELECT user_id, email, phone FROM users WHERE email = ? OR phone = ? LIMIT 1",
    [email, phone]
  );

  if (exists.length) {
    const found = exists[0];
    const errors: Record<string, string[]> = {};
    if (found.email === email) errors.email = ["Este correo ya esta registrado"];
    if (phone && found.phone === phone) errors.phone = ["Este telefono ya esta registrado"];
    return res.status(409).json({ message: "Usuario duplicado", errors });
  }

  const passwordHash = await hashPassword(password);
  const [result] = await pool.query<ResultSetHeader>(
    "INSERT INTO users (name, email, password_hash, phone, type) VALUES (?, ?, ?, ?, ?)",
    [name, email, passwordHash, phone, type]
  );

  return res.status(201).json({ message: "Registro exitoso", userId: result.insertId });
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Datos invalidos", errors: parsed.error.flatten().fieldErrors });
  }

  const { email, password } = parsed.data;
  const [rows] = await pool.query<UserRow[]>("SELECT * FROM users WHERE email = ? LIMIT 1", [email]);
  const user = rows[0];
  if (!user || !user.password_hash) return res.status(401).json({ message: "Correo o contrasena incorrectos" });

  const validPassword = await comparePassword(password, user.password_hash);
  if (!validPassword) {
    return res.status(401).json({ message: "Correo o contrasena incorrectos" });
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
  const [rows] = await pool.query<UserRow[]>("SELECT * FROM users WHERE user_id = ? LIMIT 1", [authUser.id]);
  if (!rows[0]) return res.status(404).json({ message: "Usuario no encontrado" });
  res.json({ user: publicUser(rows[0]) });
}
