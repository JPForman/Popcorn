import { Router } from "express";
import {
  createCommentSchema,
  createRatingSchema,
  ratingIdParamsSchema,
  ratingParamsSchema,
  updateRatingSchema,
} from "@popcorn/shared";
import { requireAuth, optionalAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createRating, patchRating, removeRating } from "../controllers/ratings.controller.js";
import { listComments, postComment } from "../controllers/comment.controller.js";

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

ratingsRouter.post(
  "/:ratingId/comments",
  requireAuth,
  validate(ratingIdParamsSchema, "params"),
  validate(createCommentSchema, "body"),
  postComment,
);

ratingsRouter.get(
  "/:ratingId/comments",
  optionalAuth,
  validate(ratingIdParamsSchema, "params"),
  listComments,
);
