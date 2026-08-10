import { Link, useParams } from "react-router-dom";
import { usePublicUser } from "../hooks/api/usePublicUser";
import { useCurrentUser } from "../hooks/api/useCurrentUser";
import { FollowButton } from "../components/social/FollowButton";
import styles from "./ProfilePage.module.scss";

export function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { data: user, isLoading, isError } = usePublicUser(userId);
  const { data: currentUser } = useCurrentUser();

  if (isLoading) return <p>Loading…</p>;
  if (isError || !user) return <p role="alert">Couldn't load this profile.</p>;

  const isOwnProfile = currentUser?.id === user.id;

  return (
    <div className={styles.profile}>
      {user.avatarUrl && <img src={user.avatarUrl} alt="" className={styles.avatar} />}
      <h1>{user.displayName}</h1>
      {user.bio && <p>{user.bio}</p>}

      <div className={styles.stats}>
        <span>{user.followerCount} followers</span>
        <span>{user.followingCount} following</span>
      </div>

      {!isOwnProfile && currentUser && (
        <FollowButton userId={user.id} isFollowing={user.viewerIsFollowing} />
      )}

      <p>
        <Link to={`/u/${user.id}/timeline`}>View timeline</Link>
      </p>
    </div>
  );
}
