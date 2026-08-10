import { Link, useParams } from "react-router-dom";
import type { TitleType } from "@popcorn/shared";
import { useTitleDetail } from "../hooks/api/useTitleDetail";
import { useAuth } from "../hooks/useAuth";
import { PopcornRating } from "../components/rating/PopcornRating";
import { RatingForm } from "../components/rating/RatingForm";
import styles from "./TitleDetailPage.module.scss";

export function TitleDetailPage() {
  const { tmdbId, type } = useParams<{ tmdbId: string; type: TitleType }>();
  const { firebaseUser } = useAuth();
  const { data, isLoading, isError } = useTitleDetail(Number(tmdbId), type as TitleType);

  if (isLoading) return <p>Loading…</p>;
  if (isError || !data) return <p role="alert">Couldn't load this title. Try again.</p>;

  return (
    <article className={styles.layout}>
      {data.posterUrl && (
        <img src={data.posterUrl} alt={`${data.name} poster`} className={styles.poster} />
      )}
      <div className={styles.details}>
        <h1>
          {data.name} {data.releaseYear && <span className={styles.year}>({data.releaseYear})</span>}
        </h1>
        {data.synopsis && <p>{data.synopsis}</p>}

        <div className={styles.ratingSummary}>
          <PopcornRating value={data.averageScore ?? 0} readOnly showValueLabel />
          <span className={styles.ratingCount}>
            {data.ratingCount > 0
              ? `${data.ratingCount} rating${data.ratingCount === 1 ? "" : "s"}`
              : "No ratings yet"}
          </span>
        </div>

        {firebaseUser ? (
          <RatingForm tmdbId={data.tmdbId} type={data.type} initialRating={data.viewerRating} />
        ) : (
          <p>
            <Link to="/login">Log in</Link> to rate this.
          </p>
        )}

        {data.cast.length > 0 && (
          <>
            <h2>Cast</h2>
            <ul className={styles.cast}>
              {data.cast.map((member) => (
                <li key={member.id}>
                  {member.name} as {member.character}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </article>
  );
}
