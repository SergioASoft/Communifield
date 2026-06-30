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
import { transporter } from "../services/MailService";
import jwt from "jsonwebtoken"; // <-- NUEVO: Importamos JWT


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
    return res.status(400).json({
      message: "Datos invalidos",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const { name, email, phone, password, type, bio, photo, position } = parsed.data;

  const [exists] = await pool.query<UserRow[]>(
    "SELECT id_usuario FROM USUARIO WHERE email = ? LIMIT 1",
    [email]
  );

  if (exists.length) {
    return res.status(409).json({
      message: "Este correo ya esta registrado",
      errors: {
        email: ["Este correo ya esta registrado"],
      },
    });
  }

  const passwordHash = await hashPassword(password);

  const verificationToken = jwt.sign(
    {
      name,
      email,
      phone,
      passwordHash,
      type,
      bio: bio || null,
      photo: photo || null,
      position: position || null,
    },
    env.jwtSecret,
    { expiresIn: "5m" }
  );

  try {
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
              Hola ${name}, gracias por registrarte.
            </p>

            <p style="color:#3d5c3d;font-size:15px;line-height:1.6;">
              Para activar tu cuenta, haz clic en el botón.
              Este enlace será válido durante <strong>5 minutos</strong>.
            </p>

            <a href="${env.frontendUrl}/verify/${verificationToken}"
              style="display:inline-block;background:#00ab00;color:#ffffff;text-decoration:none;
              padding:14px 22px;border-radius:10px;font-weight:bold;margin-top:12px;">
              Verificar cuenta
            </a>
          </div>
        </div>
      </div>
    `,
  });
  return res.status(201).json({
    message: "Registro exitoso. Revisa tu correo para verificar la cuenta.",
  });
} catch (err) {
    console.error("ERROR enviando correo");
    console.error(err);
    return res.status(500).json({
        message: "No fue posible enviar el correo de verificación."
    });
}
}

export async function login(req: Request, res: Response) {
  try {
    console.log("========== LOGIN ==========");
    console.log("1. Body recibido:", req.body);

    const parsed = loginSchema.safeParse(req.body);

    console.log("2. Schema validado");

    if (!parsed.success) {
      console.log("Schema inválido");
      return res.status(400).json({
        message: "Datos inválidos",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const { email, password } = parsed.data;

    console.log("3. Email:", email);

    const [rows] = await pool.query<UserRow[]>(
      `SELECT ${userColumns} FROM USUARIO WHERE email = ? LIMIT 1`,
      [email]
    );

    console.log("4. Query ejecutada correctamente");

    const user = rows[0];

    console.log("5. Usuario encontrado:", user);

    if (!user || !user.password_hash) {
      console.log("Usuario no encontrado");
      return res.status(401).json({
        message: "Correo o contraseña incorrectos",
      });
    }

    console.log("6. Comparando contraseña...");

    const validPassword = await comparePassword(
      password,
      user.password_hash
    );

    console.log("7. Contraseña válida:", validPassword);

    if (!validPassword) {
      return res.status(401).json({
        message: "Correo o contraseña incorrectos",
      });
    }

    const tokenUser = {
      id: user.user_id,
      user_id: user.user_id,
      email: user.email,
      type: user.type,
      role: roleFromType(user.type),
    };

    console.log("8. Creando JWT...");

    const token = signToken(tokenUser);

    console.log("9. JWT creado");

    const publicData = publicUser(user);

    console.log("10. Enviando respuesta");

    return res.json({
      message: "Inicio de sesión exitoso",
      token,
      user: publicData,
      redirectTo: publicData.redirectTo,
      expiresIn: env.jwtExpiresIn,
    });

  } catch (error) {
    console.error("==================================");
    console.error("ERROR EN LOGIN");
    console.error(error);
    console.error("==================================");

    return res.status(500).json({
      message: "Error interno",
    });
  }
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
  const token = String(req.params.token);

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as unknown as {
      name: string;
      email: string;
      phone: string;
      passwordHash: string;
      type: UserType;
      bio: string | null;
      photo: string | null;
      position: string | null;
    };

    const [exists] = await pool.query<any[]>(
      "SELECT id_usuario FROM USUARIO WHERE email = ? LIMIT 1",
      [decoded.email]
    );

    if (exists.length) {
      return res.status(200).json({
        message: "Tu cuenta ya está verificada. Ya puedes iniciar sesión.",
      });
    }

    await pool.query(
      `
      INSERT INTO USUARIO
      (nombre, email, \`contraseña_hash\`, tel, Tipo, biografia, foto, posicion)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        decoded.name,
        decoded.email,
        decoded.passwordHash,
        decoded.phone,
        decoded.type,
        decoded.bio,
        decoded.photo,
        decoded.position,
      ]
    );

    return res.json({
      message: "Correo verificado exitosamente. Ya puedes iniciar sesión.",
    });
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return res.status(400).json({
        message: "El enlace de verificación ha caducado. Regístrate nuevamente.",
      });
    }

    return res.status(400).json({
      message: "Token inválido o mal formado.",
    });
  }
}



export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body;

  const [rows] = await pool.query<any[]>(
    `
    SELECT id_usuario, email, \`contraseña_hash\` AS password_hash
    FROM USUARIO
    WHERE email = ?
    LIMIT 1
    `,
    [email]
  );

  const user = rows[0];

  if (!user) {
    return res.status(404).json({
      message: "Este correo no tiene una cuenta registrada.",
    });
  }

  const token = jwt.sign(
    {
      id_usuario: user.id_usuario,
      email: user.email,
      passwordHash: user.password_hash,
    },
    env.jwtSecret,
    { expiresIn: "5m" }
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
          </div>
        </div>
      </div>
    `,
  });

  return res.json({
    message: "Correo enviado. Revisa tu bandeja de entrada.",
  });
}

export async function resetPassword(req: Request, res: Response) {
  const { token, password } = req.body;

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as {
      id_usuario: number;
      email: string;
      passwordHash: string;
    };

    const [rows] = await pool.query<any[]>(
      `
      SELECT id_usuario, email, \`contraseña_hash\` AS password_hash
      FROM USUARIO
      WHERE id_usuario = ?
      AND email = ?
      LIMIT 1
      `,
      [decoded.id_usuario, decoded.email]
    );

    const user = rows[0];

    if (!user) {
      return res.status(400).json({
        message: "El enlace para recuperar la contraseña no es válido.",
      });
    }

    if (user.password_hash !== decoded.passwordHash) {
      return res.status(400).json({
        message: "Este enlace ya fue usado o ya no es válido.",
      });
    }

    const newHash = await hashPassword(password);

    await pool.query(
      `
      UPDATE USUARIO
      SET \`contraseña_hash\` = ?
      WHERE id_usuario = ?
      `,
      [newHash, user.id_usuario]
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