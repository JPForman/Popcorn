import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function HomePage() {
  const { firebaseUser } = useAuth();

  return (
    <div>
      <h1>🍿 Popcorn</h1>
      <p>Rate movies and TV shows, 0 to 6 bags, half-bag increments.</p>
      {firebaseUser ? (
        <p>
          <Link to="/search">Find something to rate</Link>
        </p>
      ) : (
        <p>
          <Link to="/signup">Sign up</Link> to start tracking what you watch.
        </p>
      )}
    </div>
  );
}
