import { Router } from "express";
import { register } from "../controllers/auth.controller";
import * as UserController from "../controllers/userController";

export const userRouter = Router();

userRouter.post("/register", register);
userRouter.post("/", UserController.createUser);
userRouter.get("/", UserController.getAllUsers);
userRouter.get("/:id", UserController.getUserById);
userRouter.put("/:id", UserController.updateUser);
userRouter.delete("/:id", UserController.deleteUser);
