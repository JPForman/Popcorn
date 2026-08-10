import { Link } from "react-router-dom";
import type { TimelineEntry } from "../../hooks/api/useRatings";
import { PopcornRating } from "./PopcornRating";
import styles from "./RatingCard.module.scss";

export function RatingCard({ title, score, review, createdAt }: TimelineEntry) {
  const titleHref = `/title/${title.type}/${title.tmdbId}`;

  return (
    <article className={styles.card}>
      <Link to={titleHref} className={styles.posterLink}>
        {title.posterUrl ? (
          <img src={title.posterUrl} alt={`${title.name} poster`} className={styles.poster} />
        ) : (
          <div className={styles.posterPlaceholder} aria-hidden="true" />
        )}
      </Link>
      <div className={styles.body}>
        <Link to={titleHref} className={styles.name}>
          {title.name}
          {title.releaseYear && <span className={styles.year}> ({title.releaseYear})</span>}
        </Link>
        <PopcornRating value={score} readOnly size="sm" showValueLabel />
        {review && <p className={styles.review}>{review}</p>}
        <time className={styles.date} dateTime={createdAt}>
          {new Date(createdAt).toLocaleDateString()}
        </time>
      </div>
    </article>
  );
}
