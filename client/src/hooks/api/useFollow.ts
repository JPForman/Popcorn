import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../lib/apiClient";

function invalidateFollowState(queryClient: ReturnType<typeof useQueryClient>, userId: string) {
  queryClient.invalidateQueries({ queryKey: ["user", userId] });
  queryClient.invalidateQueries({ queryKey: ["userSearch"] });
}

export function useFollowUser(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post<void>(`/api/users/${userId}/follow`),
    onSuccess: () => invalidateFollowState(queryClient, userId),
  });
}

export function useUnfollowUser(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.delete<void>(`/api/users/${userId}/follow`),
    onSuccess: () => invalidateFollowState(queryClient, userId),
  });
}
