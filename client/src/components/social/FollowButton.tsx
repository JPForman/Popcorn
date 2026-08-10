import { useFollowUser, useUnfollowUser } from "../../hooks/api/useFollow";

interface FollowButtonProps {
  userId: string;
  isFollowing: boolean;
}

export function FollowButton({ userId, isFollowing }: FollowButtonProps) {
  const followUser = useFollowUser(userId);
  const unfollowUser = useUnfollowUser(userId);
  const pending = followUser.isPending || unfollowUser.isPending;

  return (
    <button
      type="button"
      onClick={() => (isFollowing ? unfollowUser.mutate() : followUser.mutate())}
      disabled={pending}
    >
      {isFollowing ? "Unfollow" : "Follow"}
    </button>
  );
}
