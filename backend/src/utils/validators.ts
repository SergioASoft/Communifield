import { z } from "zod";

const strongPassword = z.string()
  .min(8, "La contrasena debe tener minimo 8 caracteres")
  .regex(/[A-Z]/, "La contrasena debe tener una mayuscula")
  .regex(/[a-z]/, "La contrasena debe tener una minuscula")
  .regex(/[0-9]/, "La contrasena debe tener un numero")
  .regex(/[^A-Za-z0-9]/, "La contrasena debe tener un simbolo");

export const registerSchema = z.object({
  name: z.string().min(2, "El nombre es obligatorio").max(80),
  email: z.string().email("Correo electronico invalido"),
  phone: z.string().min(7, "Telefono invalido").max(20).regex(/^[0-9+\s-]+$/, "Telefono invalido"),
  password: strongPassword,
  type: z.enum(["organizer", "player"]),
  bio: z.string().optional(),
  photo: z.string().optional(),
  photoFile: z.object({
    name: z.string(),
    type: z.string(),
    dataUrl: z.string(),
  }).optional(),
  position: z.string().max(100).optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Correo electronico invalido"),
  password: z.string().min(1, "La contrasena es obligatoria"),
});
