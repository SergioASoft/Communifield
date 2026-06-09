import nodemailer from "nodemailer";
import { env } from "../config/env";

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: env.smtpUser,
    pass: env.smtpPass,
  },
});

export async function sendVerificationEmail(to: string, verificationUrl: string) {
  await transporter.sendMail({
    from: env.smtpFrom,
    to,
    subject: "Verifica tu cuenta en CommuniField",
    html: `
      <h2>Verifica tu cuenta</h2>
      <p>Gracias por registrarte en CommuniField.</p>
      <p>Haz clic en el siguiente enlace para verificar tu cuenta:</p>
      <a href="${verificationUrl}">${verificationUrl}</a>
    `,
  });
}

export async function sendResetPasswordEmail(to: string, resetUrl: string) {
  await transporter.sendMail({
    from: env.smtpFrom,
    to,
    subject: "Recupera tu contraseña en CommuniField",
    html: `
      <h2>Recuperar contraseña</h2>
      <p>Recibimos una solicitud para cambiar tu contraseña.</p>
      <p>Haz clic en el siguiente enlace:</p>
      <a href="${resetUrl}">${resetUrl}</a>
    `,
  });
}