import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <div>
      <h1>🍿 Popcorn</h1>
      <p>Rate movies and TV shows, 0 to 5 bags</p>
      <p>
        <Link to="/search">Find something to rate</Link>
      </p>
    </div>
  );
}
