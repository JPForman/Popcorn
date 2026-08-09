import { Router } from "express";
import { titleParamsSchema } from "@popcorn/shared";
import { validate } from "../middleware/validate.js";
import { optionalAuth } from "../middleware/auth.js";
import { getTitleDetail } from "../controllers/title.controller.js";

export const titlesRouter = Router();

titlesRouter.get(
  "/:tmdbId/:type",
  optionalAuth,
  validate(titleParamsSchema, "params"),
  getTitleDetail,
);
