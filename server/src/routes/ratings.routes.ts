import { Router } from "express";
import { createRatingSchema, ratingParamsSchema, updateRatingSchema } from "@popcorn/shared";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createRating, patchRating, removeRating } from "../controllers/ratings.controller.js";

export const ratingsRouter = Router();

ratingsRouter.post("/", requireAuth, validate(createRatingSchema, "body"), createRating);

ratingsRouter.patch(
  "/:id",
  requireAuth,
  validate(ratingParamsSchema, "params"),
  validate(updateRatingSchema, "body"),
  patchRating,
);

ratingsRouter.delete(
  "/:id",
  requireAuth,
  validate(ratingParamsSchema, "params"),
  removeRating,
);
