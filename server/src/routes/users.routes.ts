import { Router } from "express";
import { requireAuth, optionalAuth } from "../middleware/auth.js";
import { getMe, getPublicUser, updateMe } from "../controllers/user.controller.js";

export const usersRouter = Router();

usersRouter.get("/me", requireAuth, getMe);
usersRouter.patch("/me", requireAuth, updateMe);
usersRouter.get("/:userId", optionalAuth, getPublicUser);
