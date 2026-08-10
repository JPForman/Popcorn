import { useFeed } from "../hooks/api/useFeed";
import { ActivityItem } from "../components/social/ActivityItem";

export function FeedPage() {
  const { data, isLoading, isError } = useFeed();

  return (
    <div>
      <h1>Feed</h1>
      {isLoading && <p>Loading…</p>}
      {isError && <p role="alert">Couldn't load your feed. Try again.</p>}
      {data && data.entries.length === 0 && (
        <p>No activity yet — follow some people to see their ratings here.</p>
      )}
      <div>
        {data?.entries.map((entry) => (
          <ActivityItem key={entry.id} {...entry} />
        ))}
      </div>
    </div>
  );
}
