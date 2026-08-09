import { useQuery } from "@tanstack/react-query";
import type { TitleSummary } from "@popcorn/shared";
import { apiClient } from "../../lib/apiClient";

export function useSearch(query: string) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: () => apiClient.get<TitleSummary[]>(`/api/search?q=${encodeURIComponent(query)}`),
    enabled: query.trim().length > 0,
  });
}
