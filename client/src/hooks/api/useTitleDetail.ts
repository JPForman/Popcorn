import { useQuery } from "@tanstack/react-query";
import type { TitleType } from "@popcorn/shared";
import { apiClient } from "../../lib/apiClient";

interface CastMember {
  id: number;
  name: string;
  character: string;
  profileUrl: string | null;
}

interface RatingDto {
  id: string;
  score: number;
  review: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TitleDetail {
  id: string;
  tmdbId: number;
  type: TitleType;
  name: string;
  posterUrl: string | null;
  releaseYear: number | null;
  synopsis: string | null;
  cast: CastMember[];
  averageScore: number | null;
  ratingCount: number;
  viewerRating: RatingDto | null;
}

export function useTitleDetail(tmdbId: number, type: TitleType) {
  return useQuery({
    queryKey: ["title", tmdbId, type],
    queryFn: () => apiClient.get<TitleDetail>(`/api/titles/${tmdbId}/${type}`),
  });
}
