import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../config/database";

export const loginUser = async (email: string, password: string) => {
  const [rows]: any = await db.query(
    "SELECT * FROM users WHERE email = ?",
    [email]
  );

  const user = rows[0];

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const validPassword = await bcrypt.compare(password, user.password_hash);

  if (!validPassword) {
    throw new Error("Invalid credentials");
  }

  const token = jwt.sign(
    { userId: user.user_id, type: user.type },
    process.env.JWT_SECRET as string,
    { expiresIn: "1h" }
  );

  return token;
};
