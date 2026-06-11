import { Router } from "express";
import { DashboardController } from "../controllers/dashboard.controller";
import { requireAuth } from "../middlewares/auth.middleware";

export const dashboardRouter = Router();

dashboardRouter.get("/admin", requireAuth, DashboardController.admin);
dashboardRouter.get("/manager", requireAuth, DashboardController.manager);
