import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../lib/apiClient";

export interface PublicUser {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
  followerCount: number;
  followingCount: number;
  viewerIsFollowing: boolean;
}

export function usePublicUser(userId: string | undefined) {
  return useQuery({
    queryKey: ["user", userId],
    queryFn: () => apiClient.get<PublicUser>(`/api/users/${userId}`),
    enabled: Boolean(userId),
  });
}
