import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../lib/apiClient";

export interface CommentDto {
  id: string;
  ratingId: string;
  userId: string;
  body: string;
  createdAt: string;
  user: { id: string; displayName: string; avatarUrl: string | null };
}

export function useComments(ratingId: string) {
  return useQuery({
    queryKey: ["comments", ratingId],
    queryFn: () => apiClient.get<CommentDto[]>(`/api/ratings/${ratingId}/comments`),
  });
}

export function useAddComment(ratingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { body: string }) =>
      apiClient.post<CommentDto>(`/api/ratings/${ratingId}/comments`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["comments", ratingId] }),
  });
}

export function useDeleteComment(ratingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => apiClient.delete<void>(`/api/comments/${commentId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["comments", ratingId] }),
  });
}
