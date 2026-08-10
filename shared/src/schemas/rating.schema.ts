import { z } from "zod";
import { RATING_MAX, RATING_MIN, RATING_STEP } from "../constants/rating.js";
import { titleTypeSchema } from "./title.schema.js";

export const ratingScoreSchema = z
  .number()
  .min(RATING_MIN)
  .max(RATING_MAX)
  .multipleOf(RATING_STEP);

export const createRatingSchema = z.object({
  tmdbId: z.number().int().positive(),
  type: titleTypeSchema,
  score: ratingScoreSchema,
  review: z.string().trim().max(2000).optional(),
});
export type CreateRatingInput = z.infer<typeof createRatingSchema>;

export const updateRatingSchema = z.object({
  score: ratingScoreSchema.optional(),
  review: z.string().trim().max(2000).nullable().optional(),
});
export type UpdateRatingInput = z.infer<typeof updateRatingSchema>;

export const ratingParamsSchema = z.object({
  id: z.string(),
});
export type RatingParams = z.infer<typeof ratingParamsSchema>;

export const timelineQuerySchema = z.object({
  type: titleTypeSchema.optional(),
  sort: z.enum(["date", "score"]).default("date"),
  order: z.enum(["asc", "desc"]).default("desc"),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export type TimelineQuery = z.infer<typeof timelineQuerySchema>;
