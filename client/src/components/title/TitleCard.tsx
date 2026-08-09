import { Link } from "react-router-dom";
import type { TitleSummary } from "@popcorn/shared";
import styles from "./TitleCard.module.scss";

export function TitleCard({ tmdbId, type, name, posterUrl, releaseYear }: TitleSummary) {
  return (
    <Link to={`/title/${type}/${tmdbId}`} className={styles.card}>
      {posterUrl ? (
        <img src={posterUrl} alt={`${name} poster`} className={styles.poster} loading="lazy" />
      ) : (
        <div className={styles.posterPlaceholder} aria-hidden="true" />
      )}
      <span className={styles.name}>{name}</span>
      {releaseYear && <span className={styles.year}>{releaseYear}</span>}
    </Link>
  );
}
