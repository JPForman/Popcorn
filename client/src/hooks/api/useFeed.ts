import { useQuery } from "@tanstack/react-query";
import type { RatingDto, TimelineEntry } from "./useRatings";
import { apiClient } from "../../lib/apiClient";

interface Rater {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface FeedEntry extends RatingDto {
  title: TimelineEntry["title"];
  user: Rater;
}

export interface FeedResponse {
  entries: FeedEntry[];
  nextCursor: string | null;
}

export function useFeed() {
  return useQuery({
    queryKey: ["feed"],
    queryFn: () => apiClient.get<FeedResponse>("/api/feed"),
  });
}
