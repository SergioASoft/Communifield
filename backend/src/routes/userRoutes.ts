import { Router } from "express";
import { getUsers, getMe, updateMe } from "../controllers/userController";

const router = Router();

router.get("/", getUsers);
router.get("/me", getMe);
router.put("/me", updateMe);

export default router;