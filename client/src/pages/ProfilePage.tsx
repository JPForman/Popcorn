import { useParams } from "react-router-dom";

export function ProfilePage() {
  const { userId } = useParams();
  return (
    <div>
      <h1>Profile</h1>
      <p>Public profile for {userId} arrives in Phase 4.</p>
    </div>
  );
}
