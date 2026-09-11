import { useMemo, useState } from "react";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useSearch } from "../hooks/api/useSearch";
import { TitleCard } from "../components/title/TitleCard";
import { randomLetter, shuffle } from "../lib/random";
import styles from "./SearchPage.module.scss";

export function SearchPage() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query);
  const isSearching = debouncedQuery.trim().length > 0;

  const { data: searchData, isLoading: isSearchLoading, isError: isSearchError } =
    useSearch(debouncedQuery);

  const [randomLetters] = useState(() => [randomLetter(), randomLetter()]);
  const { data: randomData1 } = useSearch(randomLetters[0]);
  const { data: randomData2 } = useSearch(randomLetters[1]);

  const randomResults = useMemo(() => {
    const pool = new Map(
      [...(randomData1 ?? []), ...(randomData2 ?? [])].map((r) => [`${r.type}-${r.tmdbId}`, r]),
    );
    return shuffle([...pool.values()]).slice(0, 25);
  }, [randomData1, randomData2]);

  const results = isSearching ? searchData : randomResults;

  return (
    <div>
      <h1>Search</h1>
      <input
        type="search"
        className={styles.searchInput}
        placeholder="Search movies and TV shows…"
        aria-label="Search movies and TV shows"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {isSearching && isSearchLoading && <p>Searching…</p>}
      {isSearching && isSearchError && (
        <p role="alert">Something went wrong searching TMDB. Try again.</p>
      )}
      {isSearching && searchData?.length === 0 && <p>No results for "{debouncedQuery}".</p>}
      <div className={styles.results}>
        {results?.map((result) => (
          <TitleCard key={`${result.type}-${result.tmdbId}`} {...result} />
        ))}
      </div>
    </div>
  );
}
