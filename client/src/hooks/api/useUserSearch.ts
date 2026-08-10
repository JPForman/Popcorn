import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../lib/apiClient";

export interface UserSearchResult {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  viewerIsFollowing: boolean;
}

export function useUserSearch(query: string) {
  return useQuery({
    queryKey: ["userSearch", query],
    queryFn: () => apiClient.get<UserSearchResult[]>(`/api/users?q=${encodeURIComponent(query)}`),
    enabled: query.trim().length > 0,
  });
}
