import { useState, type FormEvent } from "react";
import type { TitleType } from "@popcorn/shared";
import { PopcornRating } from "./PopcornRating";
import { useDeleteRating, useUpsertRating } from "../../hooks/api/useRatings";
import styles from "./RatingForm.module.scss";

interface RatingFormProps {
  tmdbId: number;
  type: TitleType;
  initialRating: { id: string; score: number; review: string | null } | null;
}

export function RatingForm({ tmdbId, type, initialRating }: RatingFormProps) {
  const [score, setScore] = useState(initialRating?.score ?? 0);
  const [review, setReview] = useState(initialRating?.review ?? "");
  const upsertRating = useUpsertRating();
  const deleteRating = useDeleteRating();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    upsertRating.mutate({ tmdbId, type, score, review: review.trim() || undefined });
  }

  function handleDelete() {
    if (!initialRating) return;
    deleteRating.mutate({ id: initialRating.id, tmdbId, type });
    setScore(0);
    setReview("");
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2>{initialRating ? "Your rating" : "Rate this"}</h2>
      <PopcornRating value={score} onChange={setScore} size="lg" showValueLabel />
      <textarea
        placeholder="Add a review (optional)"
        value={review}
        onChange={(e) => setReview(e.target.value)}
        maxLength={2000}
        rows={3}
      />
      <div className={styles.actions}>
        <button type="submit" disabled={upsertRating.isPending}>
          {initialRating ? "Update rating" : "Save rating"}
        </button>
        {initialRating && (
          <button type="button" onClick={handleDelete} disabled={deleteRating.isPending}>
            Delete
          </button>
        )}
      </div>
      {upsertRating.isError && <p role="alert">Couldn't save your rating. Try again.</p>}
      {deleteRating.isError && <p role="alert">Couldn't delete your rating. Try again.</p>}
    </form>
  );
}
