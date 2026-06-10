import { Request, Response } from "express";
import { RowDataPacket } from "mysql2";
import { pool } from "../config/db";
import { env } from "../config/env";
import { comparePassword, hashPassword } from "../utils/password";
import { signToken } from "../utils/jwt";
import { loginSchema, registerSchema } from "../utils/validators";
import { UserType } from "../models/user";
import { UpdateUserDTO } from "../dtos/UpdateUserDTO";
import { UserService } from "../services/userService";
import crypto from "crypto";
import { transporter } from "../services/MailService";
import jwt from "jsonwebtoken"; // <-- NUEVO: Importamos JWT

type UserRow = RowDataPacket & {
  user_id: number;
  id_usuario: number;
  email_verificado: boolean;
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
  email_verificado,
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

  // CAMBIO 1: Generamos un JWT con expiración de 15 minutos en lugar de crypto
  const verificationToken = jwt.sign(
    { id_usuario: newUser.user_id },
    env.jwtSecret, // Usamos tu secreto del env
    { expiresIn: "15m" } // <-- Caducidad
  );

  await pool.query(
    `
  UPDATE USUARIO
  SET token_verificacion = ?
  WHERE id_usuario = ?
  `,
    [verificationToken, newUser.user_id]
  );

  await transporter.sendMail({
  from: process.env.SMTP_FROM,
  to: email,
  subject: "Verifica tu cuenta - CommuniField",
  html: `
    <div style="margin:0;padding:0;background:#edf7ed;font-family:Arial,sans-serif;">
      <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
        <div style="background:#ffffff;border-radius:18px;padding:32px;border:1px solid rgba(0,171,0,0.18);">
          <h1 style="margin:0;color:#00ab00;font-size:28px;">CommuniField</h1>
          <h2 style="color:#0e260e;">Verifica tu cuenta</h2>

          <p style="color:#3d5c3d;font-size:15px;line-height:1.6;">
            Hola ${name}, gracias por registrarte en CommuniField.
          </p>

          <p style="color:#3d5c3d;font-size:15px;line-height:1.6;">
            Para activar tu cuenta, haz clic en el siguiente botón.
            Este enlace será válido durante <strong>15 minutos</strong>.
          </p>

          <a href="${env.frontendUrl}/verify/${verificationToken}"
            style="display:inline-block;background:#00ab00;color:#ffffff;text-decoration:none;
            padding:14px 22px;border-radius:10px;font-weight:bold;margin-top:12px;">
            Verificar cuenta
          </a>

          <p style="color:#6e8f6e;font-size:13px;line-height:1.6;margin-top:24px;">
            Si no creaste esta cuenta, puedes ignorar este correo.
          </p>
        </div>
      </div>
    </div>
  `,
});

  return res.status(201).json({
    message: "Registro exitoso. Revisa tu correo para verificar la cuenta.",
    userId: newUser?.user_id,
  });
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Datos invalidos", errors: parsed.error.flatten().fieldErrors });
  }

  const { email, password } = parsed.data;
  const [rows] = await pool.query<UserRow[]>(`SELECT ${userColumns} FROM USUARIO WHERE email = ? LIMIT 1`, [email]);
  const user = rows[0];
  if (!user || !user.password_hash) return res.status(401).json({ message: "Correo o contraseña incorrectos" });

  const validPassword = await comparePassword(password, user.password_hash);
  if (!validPassword) {
    return res.status(401).json({ message: "Correo o contraseña incorrectos" });
  }
  if (!user.email_verificado) {
    return res.status(403).json({
      message: "Debes verificar tu correo"
    });
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

export async function verifyEmail(req: Request, res: Response) {
  const { token } = req.params;

  try {
    const decoded = jwt.verify(token as string, env.jwtSecret) as unknown as { id_usuario: number };

    const [rows] = await pool.query<any[]>(
      `SELECT * FROM USUARIO WHERE id_usuario = ? AND token_verificacion = ? LIMIT 1`,
      [decoded.id_usuario, token]
    );

    const user = rows[0];

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    if (user.email_verificado) {
      return res.status(200).json({ 
        message: "Tu cuenta ya estaba verificada previamente. ¡Puedes iniciar sesión!" 
      });
    }

    await pool.query(
      `
      UPDATE USUARIO
      SET
        email_verificado = TRUE,
        token_verificacion = NULL
      WHERE id_usuario = ?
      `,
      [user.id_usuario]
    );

    return res.json({ message: "Correo verificado exitosamente" });

  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return res.status(400).json({ 
        message: "El enlace de verificación ha caducado (15 minutos). Por favor, regístrate nuevamente o solicita otro enlace." 
      });
    }
    return res.status(400).json({ message: "Token inválido o mal formado" });
  }
}

export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body;

  const token = jwt.sign(
  { email },
  env.jwtSecret,
  { expiresIn: "5m" }
);

  await pool.query(
    `
    UPDATE USUARIO
    SET
      reset_token = ?
    WHERE email = ?
    `,
    [token, email]
  );

  await transporter.sendMail({
  from: process.env.SMTP_FROM,
  to: email,
  subject: "Recupera tu contraseña - CommuniField",
  html: `
    <div style="margin:0;padding:0;background:#edf7ed;font-family:Arial,sans-serif;">
      <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
        <div style="background:#ffffff;border-radius:18px;padding:32px;border:1px solid rgba(0,171,0,0.18);">
          <h1 style="margin:0;color:#00ab00;font-size:28px;">CommuniField</h1>
          <h2 style="color:#0e260e;">Recuperar contraseña</h2>

          <p style="color:#3d5c3d;font-size:15px;line-height:1.6;">
            Recibimos una solicitud para cambiar la contraseña de tu cuenta.
          </p>

          <p style="color:#3d5c3d;font-size:15px;line-height:1.6;">
            Este enlace será válido durante <strong>5 minutos</strong>.
          </p>

          <a href="${env.frontendUrl}/reset-password/${token}"
            style="display:inline-block;background:#00ab00;color:#ffffff;text-decoration:none;
            padding:14px 22px;border-radius:10px;font-weight:bold;margin-top:12px;">
            Cambiar contraseña
          </a>

          <p style="color:#6e8f6e;font-size:13px;line-height:1.6;margin-top:24px;">
            Si no solicitaste este cambio, puedes ignorar este correo.
          </p>
        </div>
      </div>
    </div>
  `,
});

  res.json({ message: "Correo enviado" });
}

export async function resetPassword(req: Request, res: Response) {
  const { token, password } = req.body;

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as { email: string };

    const [rows] = await pool.query<any[]>(
      `
      SELECT *
      FROM USUARIO
      WHERE email = ?
      AND reset_token = ?
      LIMIT 1
      `,
      [decoded.email, token]
    );

    const user = rows[0];

    if (!user) {
      return res.status(400).json({
        message: "El enlace para recuperar la contraseña ya no es válido.",
      });
    }

    const hash = await hashPassword(password);

    await pool.query(
      `
      UPDATE USUARIO
      SET
        contraseña_hash = ?,
        reset_token = NULL,
        reset_token_expira = NULL
      WHERE id_usuario = ?
      `,
      [hash, user.id_usuario]
    );

    return res.json({
      message: "Contraseña actualizada correctamente.",
    });
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return res.status(400).json({
        message: "El enlace para recuperar la contraseña ha caducado.",
      });
    }

    return res.status(400).json({
      message: "El enlace para recuperar la contraseña no es válido.",
    });
  }
}