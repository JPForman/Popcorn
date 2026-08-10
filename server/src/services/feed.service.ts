import type { FeedQuery } from "@popcorn/shared";
import { prisma } from "../lib/prisma.js";
import { toRatingDto } from "../lib/dto.js";

const RATER_SELECT = {
  id: true,
  displayName: true,
  avatarUrl: true,
} as const;

export async function getFeed(viewerId: string, query: FeedQuery) {
  const ratings = await prisma.rating.findMany({
    where: { user: { followers: { some: { followerId: viewerId } } } },
    include: { title: true, user: { select: RATER_SELECT } },
    orderBy: { createdAt: "desc" },
    take: query.limit + 1,
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
  });

  const hasMore = ratings.length > query.limit;
  const page = hasMore ? ratings.slice(0, query.limit) : ratings;

  return {
    entries: page.map(toRatingDto),
    nextCursor: hasMore ? page[page.length - 1].id : null,
  };
}
