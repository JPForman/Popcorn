import { Router } from "express";
import { commentParamsSchema } from "@popcorn/shared";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { removeComment } from "../controllers/comment.controller.js";

export const commentsRouter = Router();

commentsRouter.delete("/:id", requireAuth, validate(commentParamsSchema, "params"), removeComment);
