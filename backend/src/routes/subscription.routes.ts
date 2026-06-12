import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware";
import { SubscriptionController } from "../controllers/subscription.controller";

const router = Router();

router.get("/status", requireAuth, SubscriptionController.status);
router.post("/checkout", requireAuth, SubscriptionController.createCheckout);
router.post("/confirm", requireAuth, SubscriptionController.confirmCheckout);

export default router;
