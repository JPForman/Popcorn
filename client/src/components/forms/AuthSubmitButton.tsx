import type { ReactNode } from "react";
import styles from "./AuthSubmitButton.module.scss";

interface AuthSubmitButtonProps {
  children: ReactNode;
  disabled?: boolean;
}

export function AuthSubmitButton({ children, disabled }: AuthSubmitButtonProps) {
  return (
    <button type="submit" className={styles.button} disabled={disabled}>
      {children}
    </button>
  );
}
