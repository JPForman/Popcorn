import { env } from "../config/env.js";
import type { TitleType } from "@popcorn/shared";

interface TmdbSearchResult {
  id: number;
  media_type?: "movie" | "tv";
  title?: string;
  name?: string;
  poster_path: string | null;
  release_date?: string;
  first_air_date?: string;
}

interface TmdbSearchResponse {
  results: TmdbSearchResult[];
}

interface TmdbCastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

interface TmdbTitleDetails {
  id: number;
  title?: string;
  name?: string;
  overview: string | null;
  poster_path: string | null;
  release_date?: string;
  first_air_date?: string;
  credits?: { cast: TmdbCastMember[] };
}

function posterUrl(path: string | null): string | null {
  return path ? `${env.TMDB_IMAGE_BASE_URL}w500${path}` : null;
}

function releaseYear(dateStr: string | undefined): number | null {
  if (!dateStr) return null;
  const year = Number(dateStr.slice(0, 4));
  return Number.isNaN(year) ? null : year;
}

async function tmdbFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${env.TMDB_API_BASE_URL}${path}`);
  url.searchParams.set("api_key", env.TMDB_API_KEY);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`TMDB request failed: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export interface TmdbSearchHit {
  tmdbId: number;
  type: TitleType;
  name: string;
  posterUrl: string | null;
  releaseYear: number | null;
}

export async function searchTmdb(query: string): Promise<TmdbSearchHit[]> {
  const data = await tmdbFetch<TmdbSearchResponse>("/search/multi", { query });

  return data.results
    .filter((r) => r.media_type === "movie" || r.media_type === "tv")
    .map((r) => ({
      tmdbId: r.id,
      type: (r.media_type === "tv" ? "TV" : "MOVIE") as TitleType,
      name: (r.title ?? r.name ?? "Untitled") as string,
      posterUrl: posterUrl(r.poster_path),
      releaseYear: releaseYear(r.release_date ?? r.first_air_date),
    }));
}

export interface TmdbTitleDetail {
  tmdbId: number;
  name: string;
  posterUrl: string | null;
  releaseYear: number | null;
  synopsis: string | null;
  cast: { id: number; name: string; character: string; profileUrl: string | null }[];
}

export async function fetchTmdbTitleDetail(
  tmdbId: number,
  type: TitleType,
): Promise<TmdbTitleDetail> {
  const endpoint = type === "TV" ? `/tv/${tmdbId}` : `/movie/${tmdbId}`;
  const data = await tmdbFetch<TmdbTitleDetails>(endpoint, { append_to_response: "credits" });

  return {
    tmdbId: data.id,
    name: (data.title ?? data.name ?? "Untitled") as string,
    posterUrl: posterUrl(data.poster_path),
    releaseYear: releaseYear(data.release_date ?? data.first_air_date),
    synopsis: data.overview,
    cast: (data.credits?.cast ?? []).slice(0, 12).map((c) => ({
      id: c.id,
      name: c.name,
      character: c.character,
      profileUrl: posterUrl(c.profile_path),
    })),
  };
}
