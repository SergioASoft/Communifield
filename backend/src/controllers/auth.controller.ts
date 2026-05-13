import { Request, Response } from "express";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/db";
import { env } from "../config/env";
import { comparePassword, hashPassword } from "../utils/password";
import { signToken } from "../utils/jwt";
import { loginSchema, registerSchema } from "../utils/validators";

type UserRow = RowDataPacket & {
  id: number;
  name: string;
  username: string;
  email: string;
  phone: string;
  password_hash: string | null;
  role: "gestor" | "player";
  failed_attempts: number;
  blocked_until: Date | null;
};

const publicUser = (user: UserRow) => ({
  id: user.id,
  name: user.name,
  username: user.username,
  email: user.email,
  phone: user.phone,
  role: user.role,
});

export async function register(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Datos inválidos", errors: parsed.error.flatten().fieldErrors });
  }

  const { name, username, email, phone, password, role } = parsed.data;
  const [exists] = await pool.query<UserRow[]>(
    "SELECT id, email, username, phone FROM users WHERE email = ? OR username = ? OR phone = ? LIMIT 1",
    [email, username, phone]
  );

  if (exists.length) {
    const found = exists[0];
    const errors: Record<string, string[]> = {};
    if (found.email === email) errors.email = ["Este correo ya está registrado"];
    if (found.username === username) errors.username = ["Este nombre de usuario ya existe"];
    if (found.phone === phone) errors.phone = ["Este teléfono ya está registrado"];
    return res.status(409).json({ message: "Usuario duplicado", errors });
  }

  const passwordHash = await hashPassword(password);
  const [result] = await pool.query<ResultSetHeader>(
    "INSERT INTO users (name, username, email, phone, password_hash, role, provider, email_verified) VALUES (?, ?, ?, ?, ?, ?, 'credentials', 1)",
    [name, username, email, phone, passwordHash, role]
  );

  return res.status(201).json({ message: "Registro exitoso", userId: result.insertId });
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Datos inválidos", errors: parsed.error.flatten().fieldErrors });
  }

  const { email, password, role } = parsed.data;
  const [rows] = await pool.query<UserRow[]>("SELECT * FROM users WHERE email = ? LIMIT 1", [email]);
  const user = rows[0];
  if (!user || !user.password_hash) return res.status(401).json({ message: "Correo o contraseña incorrectos" });

  if (user.blocked_until && new Date(user.blocked_until).getTime() > Date.now()) {
    return res.status(423).json({ message: `Cuenta bloqueada por intentos fallidos. Intenta después de ${new Date(user.blocked_until).toLocaleString()}` });
  }

  if (role && user.role !== role) {
    return res.status(403).json({ message: "El usuario no corresponde al tipo de acceso seleccionado" });
  }

  const validPassword = await comparePassword(password, user.password_hash);
  if (!validPassword) {
    const attempts = user.failed_attempts + 1;
    const shouldBlock = attempts >= env.loginMaxAttempts;
    const blockedUntil = shouldBlock ? new Date(Date.now() + env.loginBlockMinutes * 60 * 1000) : null;
    await pool.query("UPDATE users SET failed_attempts = ?, blocked_until = ? WHERE id = ?", [shouldBlock ? 0 : attempts, blockedUntil, user.id]);
    return res.status(401).json({
      message: shouldBlock
        ? `Cuenta bloqueada por ${env.loginBlockMinutes} minutos por intentos fallidos`
        : `Contraseña incorrecta. Intentos restantes: ${env.loginMaxAttempts - attempts}`,
    });
  }

  await pool.query("UPDATE users SET failed_attempts = 0, blocked_until = NULL, last_login_at = NOW() WHERE id = ?", [user.id]);
  const token = signToken({ id: user.id, email: user.email, role: user.role });
  return res.json({ message: "Inicio de sesión exitoso", token, user: publicUser(user), expiresIn: env.jwtExpiresIn });
}

export async function me(req: Request, res: Response) {
  const authUser = (req as any).user;
  const [rows] = await pool.query<UserRow[]>("SELECT * FROM users WHERE id = ? LIMIT 1", [authUser.id]);
  if (!rows[0]) return res.status(404).json({ message: "Usuario no encontrado" });
  res.json({ user: publicUser(rows[0]) });
}
