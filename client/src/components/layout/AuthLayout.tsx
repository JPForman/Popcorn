import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { PopcornRating } from "../rating/PopcornRating";
import styles from "./AuthLayout.module.scss";

interface AuthLayoutProps {
  children: ReactNode;
}

function tabClassName({ isActive }: { isActive: boolean }) {
  return isActive ? `${styles.tab} ${styles.tabActive}` : styles.tab;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className={`${styles.screen} fullBleed`}>
      <div className={styles.visual} aria-hidden="true">
        <span className={styles.visualBrand}>🍿 Popcorn</span>
        <div className={styles.illustration}>
          {Array.from({ length: 5 }, (_, i) => (
            <span key={i}>🍿</span>
          ))}
        </div>
        <p className={styles.tagline}>Rate movies and TV shows, 0 to 5 bags</p>
        <div className={styles.floatingCard}>
          <strong>The Batman</strong>
          <PopcornRating value={5} readOnly size="sm" />
        </div>
      </div>
      <div className={styles.formPanel}>
        <h1>Welcome to Popcorn!</h1>
        <nav className={styles.tabs} aria-label="Log in or sign up">
          <NavLink to="/signup" className={tabClassName}>
            Sign up
          </NavLink>
          <NavLink to="/login" className={tabClassName}>
            Log in
          </NavLink>
        </nav>
        {children}
      </div>
    </div>
  );
}
