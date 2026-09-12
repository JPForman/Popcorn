import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UpdateProfileInput } from "@popcorn/shared";
import { apiClient } from "../../lib/apiClient";

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProfileInput) => apiClient.patch("/api/users/me", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["currentUser"] }),
  });
}
