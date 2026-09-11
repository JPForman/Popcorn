import type { UseFormRegisterReturn } from "react-hook-form";
import styles from "./AuthField.module.scss";

interface AuthFieldProps {
  id: string;
  label: string;
  type?: string;
  autoComplete?: string;
  minLength?: number;
  registration: UseFormRegisterReturn;
}

export function AuthField({ id, label, type = "text", autoComplete, minLength, registration }: AuthFieldProps) {
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      <div className={styles.inputWrap}>
        <input
          id={id}
          type={type}
          autoComplete={autoComplete}
          minLength={minLength}
          placeholder=" "
          required
          {...registration}
        />
        <svg className={styles.checkIcon} viewBox="0 0 16 16" aria-hidden="true">
          <path d="M3 8.5 6.5 12 13 4" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <svg className={styles.xIcon} viewBox="0 0 16 16" aria-hidden="true">
          <path d="M4 4 12 12M12 4 4 12" fill="none" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}
