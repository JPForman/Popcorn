import { useState } from "react";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useSearch } from "../hooks/api/useSearch";
import { TitleCard } from "../components/title/TitleCard";
import styles from "./SearchPage.module.scss";

export function SearchPage() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query);
  const { data, isLoading, isError } = useSearch(debouncedQuery);

  return (
    <div>
      <h1>Search</h1>
      <input
        type="search"
        placeholder="Search movies and TV shows…"
        aria-label="Search movies and TV shows"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {isLoading && <p>Searching…</p>}
      {isError && <p role="alert">Something went wrong searching TMDB. Try again.</p>}
      {data && data.length === 0 && debouncedQuery && <p>No results for "{debouncedQuery}".</p>}
      <div className={styles.results}>
        {data?.map((result) => (
          <TitleCard key={`${result.type}-${result.tmdbId}`} {...result} />
        ))}
      </div>
    </div>
  );
}
