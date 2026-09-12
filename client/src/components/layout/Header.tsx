import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { firebaseAuth } from "../../lib/firebase";
import { useAuth } from "../../hooks/useAuth";
import { useCurrentUser } from "../../hooks/api/useCurrentUser";
import styles from "./Header.module.scss";

// Keep in sync with $breakpoint-lg in styles/_variables.scss.
const DESKTOP_MEDIA_QUERY = "(min-width: 1024px)";

export function Header() {
  const { firebaseUser } = useAuth();
  const { data: currentUser } = useCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuClosedForPathname, setMenuClosedForPathname] = useState(location.pathname);
  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);

  if (location.pathname !== menuClosedForPathname) {
    setMenuClosedForPathname(location.pathname);
    setIsMenuOpen(false);
  }

  async function handleLogOut() {
    await signOut(firebaseAuth);
    navigate("/login");
  }

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY);
    function handleChange(event: MediaQueryListEvent) {
      if (event.matches) setIsMenuOpen(false);
    }
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;

    navRef.current?.querySelector("a")?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        toggleRef.current?.focus();
      }
    }

    function handlePointerDown(event: MouseEvent) {
      if (!headerRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isMenuOpen]);

  return (
    <header className={styles.header} ref={headerRef}>
      <div className={styles.bar}>
        <Link to="/" className={styles.brand}>
          🍿 Popcorn
        </Link>
        <button
          type="button"
          ref={toggleRef}
          className={styles.toggle}
          aria-expanded={isMenuOpen}
          aria-controls="primary-nav"
          aria-label="Menu"
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          <svg className={isMenuOpen ? styles.hidden : styles.icon} viewBox="0 0 20 20" aria-hidden="true">
            <path d="M2 5h16M2 10h16M2 15h16" fill="none" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <svg className={isMenuOpen ? styles.icon : styles.hidden} viewBox="0 0 20 20" aria-hidden="true">
            <path d="M3 3l14 14M17 3L3 17" fill="none" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <nav
        id="primary-nav"
        ref={navRef}
        className={isMenuOpen ? `${styles.nav} ${styles.navOpen}` : styles.nav}
        aria-label="Main navigation"
      >
        {firebaseUser ? (
          <>
            <Link to="/search">Search</Link>
            <Link to="/people">People</Link>
            {currentUser && <Link to={`/u/${currentUser.id}/timeline`}>My timeline</Link>}
            <Link to="/feed">Feed</Link>
            <Link to="/profile">Edit profile</Link>
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
