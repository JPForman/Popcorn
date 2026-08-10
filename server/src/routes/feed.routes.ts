import { Router } from "express";
import { feedQuerySchema } from "@popcorn/shared";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { feed } from "../controllers/feed.controller.js";

export const feedRouter = Router();

feedRouter.get("/", requireAuth, validate(feedQuerySchema, "query"), feed);
