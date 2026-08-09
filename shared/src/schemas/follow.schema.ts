import { z } from "zod";

export const userIdParamsSchema = z.object({
  userId: z.string(),
});
export type UserIdParams = z.infer<typeof userIdParamsSchema>;

export const feedQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export type FeedQuery = z.infer<typeof feedQuerySchema>;
