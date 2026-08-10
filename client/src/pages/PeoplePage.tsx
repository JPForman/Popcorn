import { useState } from "react";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useUserSearch } from "../hooks/api/useUserSearch";
import { UserCard } from "../components/social/UserCard";

export function PeoplePage() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query);
  const { data, isLoading, isError } = useUserSearch(debouncedQuery);

  return (
    <div>
      <h1>Find people</h1>
      <input
        type="search"
        placeholder="Search by name…"
        aria-label="Search for users by name"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {isLoading && <p>Searching…</p>}
      {isError && <p role="alert">Something went wrong searching. Try again.</p>}
      {data && data.length === 0 && debouncedQuery && <p>No users found for "{debouncedQuery}".</p>}
      <div>
        {data?.map((user) => (
          <UserCard key={user.id} {...user} />
        ))}
      </div>
    </div>
  );
}
