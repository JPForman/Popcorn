import { Router } from "express";
import { timelineQuerySchema } from "@popcorn/shared";
import { requireAuth, optionalAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { getMe, getPublicUser, getUserTimeline, updateMe } from "../controllers/user.controller.js";

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
