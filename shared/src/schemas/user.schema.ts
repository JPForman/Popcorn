import { z } from "zod";

export const AVATAR_OPTIONS = ["/avatars/avatar-1.png", "/avatars/avatar-2.png"] as const;
export type AvatarOption = (typeof AVATAR_OPTIONS)[number];

export const userProfileSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  avatarUrl: z.string().nullable(),
  bio: z.string().nullable(),
  createdAt: z.string(),
});
export type UserProfile = z.infer<typeof userProfileSchema>;

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(50).optional(),
  avatarUrl: z.enum(AVATAR_OPTIONS).nullable().optional(),
  bio: z.string().trim().max(280).nullable().optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const userSearchQuerySchema = z.object({
  q: z.string().trim().max(100).default(""),
});
export type UserSearchQuery = z.infer<typeof userSearchQuerySchema>;
