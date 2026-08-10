import { useState } from "react";
import { Link } from "react-router-dom";
import type { FeedEntry } from "../../hooks/api/useFeed";
import { PopcornRating } from "../rating/PopcornRating";
import { CommentThread } from "./CommentThread";
import styles from "./ActivityItem.module.scss";

export function ActivityItem({ id, user, title, score, review, createdAt }: FeedEntry) {
  const [showComments, setShowComments] = useState(false);
  const titleHref = `/title/${title.type}/${title.tmdbId}`;

  return (
    <article className={styles.item}>
      <Link to={titleHref} className={styles.posterLink}>
        {title.posterUrl ? (
          <img src={title.posterUrl} alt={`${title.name} poster`} className={styles.poster} />
        ) : (
          <div className={styles.posterPlaceholder} aria-hidden="true" />
        )}
      </Link>
      <div className={styles.body}>
        <p className={styles.byline}>
          <Link to={`/u/${user.id}`}>{user.displayName}</Link> rated{" "}
          <Link to={titleHref}>{title.name}</Link>
        </p>
        <PopcornRating value={score} readOnly size="sm" showValueLabel />
        {review && <p className={styles.review}>{review}</p>}
        <time className={styles.date} dateTime={createdAt}>
          {new Date(createdAt).toLocaleDateString()}
        </time>
        <button type="button" className={styles.commentsToggle} onClick={() => setShowComments((v) => !v)}>
          {showComments ? "Hide comments" : "Comments"}
        </button>
        {showComments && <CommentThread ratingId={id} />}
      </div>
    </article>
  );
}
