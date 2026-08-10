import type { Prisma } from "@prisma/client";

export function toRatingDto<T extends { score: Prisma.Decimal }>(rating: T) {
  return { ...rating, score: Number(rating.score) };
}
