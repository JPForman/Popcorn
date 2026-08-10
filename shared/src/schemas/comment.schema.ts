import { z } from "zod";

export const createCommentSchema = z.object({
  body: z.string().trim().min(1).max(1000),
});
export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export const ratingIdParamsSchema = z.object({
  ratingId: z.string(),
});
export type RatingIdParams = z.infer<typeof ratingIdParamsSchema>;

export const commentParamsSchema = z.object({
  id: z.string(),
});
export type CommentParams = z.infer<typeof commentParamsSchema>;
