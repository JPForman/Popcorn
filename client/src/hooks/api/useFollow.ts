import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../lib/apiClient";

export function useFollowUser(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post<void>(`/api/users/${userId}/follow`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user", userId] }),
  });
}

export function useUnfollowUser(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.delete<void>(`/api/users/${userId}/follow`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user", userId] }),
  });
}
