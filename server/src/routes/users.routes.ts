import { Router } from "express";
import { timelineQuerySchema, userIdParamsSchema } from "@popcorn/shared";
import { requireAuth, optionalAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { getMe, getPublicUser, getUserTimeline, updateMe } from "../controllers/user.controller.js";
import { follow, listFollowers, listFollowing, unfollow } from "../controllers/follow.controller.js";

export const usersRouter = Router();

usersRouter.get("/me", requireAuth, getMe);
usersRouter.patch("/me", requireAuth, updateMe);
usersRouter.get("/:userId", optionalAuth, getPublicUser);
usersRouter.get(
  "/:userId/ratings",
  optionalAuth,
  validate(timelineQuerySchema, "query"),
  getUserTimeline,
);

usersRouter.post("/:userId/follow", requireAuth, validate(userIdParamsSchema, "params"), follow);
usersRouter.delete("/:userId/follow", requireAuth, validate(userIdParamsSchema, "params"), unfollow);
usersRouter.get("/:userId/followers", validate(userIdParamsSchema, "params"), listFollowers);
usersRouter.get("/:userId/following", validate(userIdParamsSchema, "params"), listFollowing);
