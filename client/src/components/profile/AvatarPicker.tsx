import { AVATAR_OPTIONS, type AvatarOption } from "@popcorn/shared";
import styles from "./AvatarPicker.module.scss";

const AVATAR_LABELS: Record<AvatarOption, string> = {
  "/avatars/avatar-1.png": "Portrait avatar",
  "/avatars/avatar-2.png": "Circle-framed avatar",
};

interface AvatarPickerProps {
  value: AvatarOption | null;
  onChange: (value: AvatarOption) => void;
}

export function AvatarPicker({ value, onChange }: AvatarPickerProps) {
  return (
    <div className={styles.group} role="radiogroup" aria-label="Choose an avatar">
      {AVATAR_OPTIONS.map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={value === option}
          aria-label={AVATAR_LABELS[option]}
          className={value === option ? `${styles.option} ${styles.selected}` : styles.option}
          onClick={() => onChange(option)}
        >
          <img src={option} alt="" />
        </button>
      ))}
    </div>
  );
}
