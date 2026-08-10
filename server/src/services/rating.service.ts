import type { CreateRatingInput, TimelineQuery, UpdateRatingInput } from "@popcorn/shared";
import { prisma } from "../lib/prisma.js";
import { ForbiddenError, NotFoundError } from "../lib/errors.js";
import { toRatingDto } from "../lib/dto.js";
import { getOrFetchTitle } from "./title.service.js";

export async function upsertRating(userId: string, input: CreateRatingInput) {
  const title = await getOrFetchTitle(input.tmdbId, input.type);

  const rating = await prisma.rating.upsert({
    where: { userId_titleId: { userId, titleId: title.id } },
    update: { score: input.score, review: input.review ?? null },
    create: { userId, titleId: title.id, score: input.score, review: input.review ?? null },
  });

  return toRatingDto(rating);
}

async function requireOwnedRating(ratingId: string, userId: string) {
  const rating = await prisma.rating.findUnique({ where: { id: ratingId } });
  if (!rating) throw new NotFoundError("Rating not found");
  if (rating.userId !== userId) throw new ForbiddenError("You can only modify your own ratings");
  return rating;
}

export async function updateRating(ratingId: string, userId: string, input: UpdateRatingInput) {
  await requireOwnedRating(ratingId, userId);
  const updated = await prisma.rating.update({ where: { id: ratingId }, data: input });
  return toRatingDto(updated);
}

export async function deleteRating(ratingId: string, userId: string) {
  await requireOwnedRating(ratingId, userId);
  await prisma.rating.delete({ where: { id: ratingId } });
}

export async function getUserRatings(userId: string, query: TimelineQuery) {
  const ratings = await prisma.rating.findMany({
    where: {
      userId,
      ...(query.type ? { title: { type: query.type } } : {}),
    },
    include: { title: true },
    orderBy: { [query.sort === "score" ? "score" : "createdAt"]: query.order },
    take: query.limit + 1,
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
  });

  const hasMore = ratings.length > query.limit;
  const page = hasMore ? ratings.slice(0, query.limit) : ratings;

  return {
    ratings: page.map(toRatingDto),
    nextCursor: hasMore ? page[page.length - 1].id : null,
  };
}
