import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../lib/apiClient";
import { useAuth } from "../useAuth";

interface CurrentUser {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
}

export function useCurrentUser() {
  const { firebaseUser } = useAuth();

  return useQuery({
    queryKey: ["currentUser"],
    queryFn: () => apiClient.get<CurrentUser>("/api/users/me"),
    enabled: Boolean(firebaseUser),
  });
}
