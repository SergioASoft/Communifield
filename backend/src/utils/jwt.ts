import jwt from "jsonwebtoken";
import { env } from "../config/env";

export type JwtUser = { id: number; user_id?: number; email: string; type: string; role?: string };
export function signToken(user: JwtUser) {
  return jwt.sign(user, env.jwtSecret, { expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"] });
}
export function verifyJwt(token: string) {
  return jwt.verify(token, env.jwtSecret) as JwtUser;
}
