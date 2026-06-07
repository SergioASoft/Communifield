import { Router } from "express";
import { FriendController } from "../controllers/friendcontroller";

const router = Router();

router.get("/search/:userId", FriendController.searchUsers);
router.get("/requests/:userId", FriendController.getRequests);
router.patch("/requests/:requestId/accept", FriendController.acceptRequest);
router.patch("/requests/:requestId/reject", FriendController.rejectRequest);
router.delete("/requests/:requestId/cancel", FriendController.cancelRequest);
router.get("/:userId", FriendController.getFriends);
router.post("/", FriendController.addFriend);

export default router;