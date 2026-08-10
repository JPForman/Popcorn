import { Link } from "react-router-dom";
import type { UserSearchResult } from "../../hooks/api/useUserSearch";
import { useCurrentUser } from "../../hooks/api/useCurrentUser";
import { FollowButton } from "./FollowButton";
import styles from "./UserCard.module.scss";

export function UserCard({ id, displayName, avatarUrl, bio, viewerIsFollowing }: UserSearchResult) {
  const { data: currentUser } = useCurrentUser();

  return (
    <article className={styles.card}>
      <Link to={`/u/${id}`} className={styles.avatarLink}>
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className={styles.avatar} />
        ) : (
          <div className={styles.avatarPlaceholder} aria-hidden="true" />
        )}
      </Link>
      <div className={styles.body}>
        <Link to={`/u/${id}`} className={styles.name}>
          {displayName}
        </Link>
        {bio && <p className={styles.bio}>{bio}</p>}
      </div>
      {currentUser && currentUser.id !== id && (
        <FollowButton userId={id} isFollowing={viewerIsFollowing} />
      )}
    </article>
  );
}
