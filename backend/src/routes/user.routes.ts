import { Router } from "express";
import { register } from "../controllers/auth.controller";

export const userRouter = Router();
userRouter.post("/register", register);
