import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateRatingInput, TitleType } from "@popcorn/shared";
import { apiClient } from "../../lib/apiClient";

export interface RatingDto {
  id: string;
  userId: string;
  titleId: string;
  score: number;
  review: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TimelineTitle {
  tmdbId: number;
  type: TitleType;
  name: string;
  posterUrl: string | null;
  releaseYear: number | null;
}

export interface TimelineEntry extends RatingDto {
  title: TimelineTitle;
}

export interface TimelineResponse {
  ratings: TimelineEntry[];
  nextCursor: string | null;
}

export interface TimelineFilters {
  type?: TitleType;
  sort?: "date" | "score";
  order?: "asc" | "desc";
}

function invalidateAfterRatingChange(
  queryClient: ReturnType<typeof useQueryClient>,
  tmdbId: number,
  type: TitleType,
) {
  queryClient.invalidateQueries({ queryKey: ["title", tmdbId, type] });
  queryClient.invalidateQueries({ queryKey: ["timeline"] });
}

export function useUpsertRating() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRatingInput) => apiClient.post<RatingDto>("/api/ratings", input),
    onSuccess: (_data, input) => invalidateAfterRatingChange(queryClient, input.tmdbId, input.type),
  });
}

export function useDeleteRating() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { id: string; tmdbId: number; type: TitleType }) =>
      apiClient.delete<void>(`/api/ratings/${variables.id}`),
    onSuccess: (_data, variables) =>
      invalidateAfterRatingChange(queryClient, variables.tmdbId, variables.type),
  });
}

export function useUserRatings(userId: string | undefined, filters: TimelineFilters) {
  const params = new URLSearchParams();
  if (filters.type) params.set("type", filters.type);
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.order) params.set("order", filters.order);

  return useQuery({
    queryKey: ["timeline", userId, filters.type, filters.sort, filters.order],
    queryFn: () => apiClient.get<TimelineResponse>(`/api/users/${userId}/ratings?${params}`),
    enabled: Boolean(userId),
  });
}
