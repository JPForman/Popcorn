import type { TitleType } from "@popcorn/shared";
import { prisma } from "../lib/prisma.js";
import { fetchTmdbTitleDetail, searchTmdb } from "./tmdb.service.js";

const TITLE_STALE_MS = 7 * 24 * 60 * 60 * 1000;

export function searchTitles(query: string) {
  return searchTmdb(query);
}

async function upsertTitleFromTmdb(tmdbId: number, type: TitleType) {
  const detail = await fetchTmdbTitleDetail(tmdbId, type);

  const title = await prisma.title.upsert({
    where: { tmdbId_type: { tmdbId, type } },
    update: {
      name: detail.name,
      posterUrl: detail.posterUrl,
      releaseYear: detail.releaseYear,
      synopsis: detail.synopsis,
      lastSyncedAt: new Date(),
    },
    create: {
      tmdbId,
      type,
      name: detail.name,
      posterUrl: detail.posterUrl,
      releaseYear: detail.releaseYear,
      synopsis: detail.synopsis,
    },
  });

  return { title, cast: detail.cast };
}

export async function getOrFetchTitle(tmdbId: number, type: TitleType, viewerId?: string) {
  const existing = await prisma.title.findUnique({ where: { tmdbId_type: { tmdbId, type } } });

  const isStale =
    !existing || Date.now() - existing.lastSyncedAt.getTime() > TITLE_STALE_MS;

  const { title, cast } = isStale
    ? await upsertTitleFromTmdb(tmdbId, type)
    : { title: existing, cast: (await fetchTmdbTitleDetail(tmdbId, type)).cast };

  const [aggregate, viewerRating] = await Promise.all([
    prisma.rating.aggregate({
      where: { titleId: title.id },
      _avg: { score: true },
      _count: true,
    }),
    viewerId
      ? prisma.rating.findUnique({
          where: { userId_titleId: { userId: viewerId, titleId: title.id } },
        })
      : Promise.resolve(null),
  ]);

  return {
    ...title,
    cast,
    averageScore: aggregate._avg.score ? Number(aggregate._avg.score) : null,
    ratingCount: aggregate._count,
    viewerRating: viewerRating
      ? { ...viewerRating, score: Number(viewerRating.score) }
      : null,
  };
}
