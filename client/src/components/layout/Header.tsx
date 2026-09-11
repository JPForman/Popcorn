import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { firebaseAuth } from "../../lib/firebase";
import { useAuth } from "../../hooks/useAuth";
import { useCurrentUser } from "../../hooks/api/useCurrentUser";
import styles from "./Header.module.scss";

export function Header() {
  const { firebaseUser } = useAuth();
  const { data: currentUser } = useCurrentUser();
  const navigate = useNavigate();

  async function handleLogOut() {
    await signOut(firebaseAuth);
    navigate("/login");
  }

  return (
    <header className={styles.header}>
      <nav className={styles.nav} aria-label="Main navigation">
        <Link to="/" className={styles.brand}>
          🍿 Popcorn
        </Link>
        {firebaseUser ? (
          <>
            <Link to="/search">Search</Link>
            <Link to="/people">People</Link>
            {currentUser && <Link to={`/u/${currentUser.id}/timeline`}>My timeline</Link>}
            <Link to="/feed">Feed</Link>
            <button type="button" onClick={handleLogOut}>
              Log out
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Log in</Link>
            <Link to="/signup">Sign up</Link>
          </>
        )}
      </nav>
    </header>
  );
}
