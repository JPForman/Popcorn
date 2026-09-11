import { useState } from "react";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useUserSearch } from "../hooks/api/useUserSearch";
import { UserCard } from "../components/social/UserCard";
import styles from "./PeoplePage.module.scss";

export function PeoplePage() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query);
  const { data, isLoading, isError } = useUserSearch(debouncedQuery);

  return (
    <div>
      <h1>Find people</h1>
      <input
        type="search"
        className={styles.searchInput}
        placeholder="Search by name…"
        aria-label="Search for users by name"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {debouncedQuery && isLoading && <p>Searching…</p>}
      {debouncedQuery && isError && <p role="alert">Something went wrong searching. Try again.</p>}
      {data && data.length === 0 && debouncedQuery && <p>No users found for "{debouncedQuery}".</p>}
      <div className={styles.results}>
        {data?.map((user) => (
          <UserCard key={user.id} {...user} />
        ))}
      </div>
    </div>
  );
}
