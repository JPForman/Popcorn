import { Link } from "react-router-dom";
import { signOut } from "firebase/auth";
import { firebaseAuth } from "../../lib/firebase";
import { useAuth } from "../../hooks/useAuth";
import styles from "./Header.module.scss";

export function Header() {
  const { firebaseUser } = useAuth();

  return (
    <header className={styles.header}>
      <nav className={styles.nav} aria-label="Main navigation">
        <Link to="/" className={styles.brand}>
          🍿 Popcorn
        </Link>
        <Link to="/search">Search</Link>
        {firebaseUser ? (
          <>
            <Link to="/feed">Feed</Link>
            <button type="button" onClick={() => signOut(firebaseAuth)}>
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
