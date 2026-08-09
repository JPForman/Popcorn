import { z } from "zod";

export const userProfileSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  avatarUrl: z.string().url().nullable(),
  bio: z.string().nullable(),
  createdAt: z.string(),
});
export type UserProfile = z.infer<typeof userProfileSchema>;

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(50).optional(),
  avatarUrl: z.string().url().max(500).nullable().optional(),
  bio: z.string().trim().max(280).nullable().optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
