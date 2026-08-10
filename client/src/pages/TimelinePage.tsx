import { useState } from "react";
import { useParams } from "react-router-dom";
import type { TitleType } from "@popcorn/shared";
import { useUserRatings, type TimelineFilters } from "../hooks/api/useRatings";
import { RatingCard } from "../components/rating/RatingCard";
import styles from "./TimelinePage.module.scss";

export function TimelinePage() {
  const { userId } = useParams<{ userId: string }>();
  const [filters, setFilters] = useState<TimelineFilters>({ sort: "date", order: "desc" });
  const { data, isLoading, isError } = useUserRatings(userId, filters);

  return (
    <div>
      <h1>Timeline</h1>
      <div className={styles.controls}>
        <label>
          Type
          <select
            value={filters.type ?? ""}
            onChange={(e) =>
              setFilters((f) => ({ ...f, type: (e.target.value || undefined) as TitleType | undefined }))
            }
          >
            <option value="">All</option>
            <option value="MOVIE">Movies</option>
            <option value="TV">TV</option>
          </select>
        </label>
        <label>
          Sort by
          <select
            value={filters.sort}
            onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value as TimelineFilters["sort"] }))}
          >
            <option value="date">Date rated</option>
            <option value="score">Rating</option>
          </select>
        </label>
        <label>
          Order
          <select
            value={filters.order}
            onChange={(e) => setFilters((f) => ({ ...f, order: e.target.value as TimelineFilters["order"] }))}
          >
            <option value="desc">Newest / highest first</option>
            <option value="asc">Oldest / lowest first</option>
          </select>
        </label>
      </div>

      {isLoading && <p>Loading…</p>}
      {isError && <p role="alert">Couldn't load this timeline. Try again.</p>}
      {data && data.ratings.length === 0 && <p>No ratings yet.</p>}

      <div>
        {data?.ratings.map((entry) => (
          <RatingCard key={entry.id} {...entry} />
        ))}
      </div>
    </div>
  );
}
