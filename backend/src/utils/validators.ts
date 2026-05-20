import { z } from "zod";

const strongPassword = z.string()
  .min(8, "La contraseña debe tener mínimo 8 caracteres")
  .regex(/[A-Z]/, "La contraseña debe tener una mayúscula")
  .regex(/[a-z]/, "La contraseña debe tener una minúscula")
  .regex(/[0-9]/, "La contraseña debe tener un número")
  .regex(/[^A-Za-z0-9]/, "La contraseña debe tener un símbolo");

export const registerSchema = z.object({
  name: z.string().min(2, "El nombre es obligatorio").max(80),
  username: z.string().min(3, "El usuario debe tener mínimo 3 caracteres").max(30)
    .regex(/^[a-zA-Z0-9_]+$/, "El usuario solo puede tener letras, números y guion bajo"),
  email: z.string().email("Correo electrónico inválido"),
  phone: z.string().min(7, "Teléfono inválido").max(20).regex(/^[0-9+\s-]+$/, "Teléfono inválido"),
  password: strongPassword,
  role: z.enum(["gestor", "player"]).default("gestor"),
});

export const loginSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
  role: z.enum(["gestor", "player"]).optional(),
});
