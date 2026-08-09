import { useParams } from "react-router-dom";

export function TimelinePage() {
  const { userId } = useParams();
  return (
    <div>
      <h1>Timeline</h1>
      <p>Watched timeline for {userId} arrives in Phase 3.</p>
    </div>
  );
}
