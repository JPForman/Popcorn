import { z } from "zod";
import { TITLE_TYPES } from "../constants/rating.js";

export const titleTypeSchema = z.enum(TITLE_TYPES);
export type TitleType = z.infer<typeof titleTypeSchema>;

export const titleParamsSchema = z.object({
  tmdbId: z.coerce.number().int().positive(),
  type: titleTypeSchema,
});
export type TitleParams = z.infer<typeof titleParamsSchema>;

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1).max(200),
  type: titleTypeSchema.optional(),
});
export type SearchQuery = z.infer<typeof searchQuerySchema>;

export const titleSummarySchema = z.object({
  tmdbId: z.number().int().positive(),
  type: titleTypeSchema,
  name: z.string(),
  posterUrl: z.string().url().nullable(),
  releaseYear: z.number().int().nullable(),
});
export type TitleSummary = z.infer<typeof titleSummarySchema>;
