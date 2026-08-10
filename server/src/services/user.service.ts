import { prisma } from "../lib/prisma.js";
import type { UpdateProfileInput } from "@popcorn/shared";

export async function bootstrapUser(firebaseUid: string, email: string, displayName: string) {
  return prisma.user.upsert({
    where: { firebaseUid },
    update: {},
    create: {
      firebaseUid,
      email,
      displayName,
    },
  });
}

export function getUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export function updateUser(id: string, input: UpdateProfileInput) {
  return prisma.user.update({ where: { id }, data: input });
}

export async function searchUsers(query: string, viewerId?: string) {
  const users = await prisma.user.findMany({
    where: {
      displayName: { contains: query, mode: "insensitive" },
      ...(viewerId ? { id: { not: viewerId } } : {}),
    },
    select: { id: true, displayName: true, avatarUrl: true, bio: true },
    orderBy: { displayName: "asc" },
    take: 20,
  });

  if (!viewerId || users.length === 0) {
    return users.map((user) => ({ ...user, viewerIsFollowing: false }));
  }

  const follows = await prisma.follow.findMany({
    where: { followerId: viewerId, followingId: { in: users.map((user) => user.id) } },
    select: { followingId: true },
  });
  const followingIds = new Set(follows.map((f) => f.followingId));

  return users.map((user) => ({ ...user, viewerIsFollowing: followingIds.has(user.id) }));
}
