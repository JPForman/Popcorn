import { prisma } from "../lib/prisma.js";
import { BadRequestError, NotFoundError } from "../lib/errors.js";

async function requireUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError("User not found");
  return user;
}

export async function followUser(followerId: string, followingId: string) {
  if (followerId === followingId) throw new BadRequestError("You can't follow yourself");
  await requireUser(followingId);

  await prisma.follow.upsert({
    where: { followerId_followingId: { followerId, followingId } },
    update: {},
    create: { followerId, followingId },
  });
}

export async function unfollowUser(followerId: string, followingId: string) {
  await prisma.follow.deleteMany({ where: { followerId, followingId } });
}

const USER_SUMMARY_SELECT = {
  id: true,
  displayName: true,
  avatarUrl: true,
} as const;

export async function getFollowers(userId: string) {
  await requireUser(userId);
  const follows = await prisma.follow.findMany({
    where: { followingId: userId },
    include: { follower: { select: USER_SUMMARY_SELECT } },
    orderBy: { createdAt: "desc" },
  });
  return follows.map((f) => f.follower);
}

export async function getFollowing(userId: string) {
  await requireUser(userId);
  const follows = await prisma.follow.findMany({
    where: { followerId: userId },
    include: { following: { select: USER_SUMMARY_SELECT } },
    orderBy: { createdAt: "desc" },
  });
  return follows.map((f) => f.following);
}

export async function isFollowing(followerId: string, followingId: string) {
  const follow = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
  });
  return Boolean(follow);
}

export async function getFollowCounts(userId: string) {
  const [followerCount, followingCount] = await Promise.all([
    prisma.follow.count({ where: { followingId: userId } }),
    prisma.follow.count({ where: { followerId: userId } }),
  ]);
  return { followerCount, followingCount };
}
