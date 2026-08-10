import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { RATING_MAX, RATING_MIN, RATING_STEP } from "@popcorn/shared";
import styles from "./PopcornRating.module.scss";

const BAG_COUNT = RATING_MAX;
const BAG_PATH = "M5 7h14l-2 14H7L5 7z";

type BagFill = "empty" | "half" | "full";

interface PopcornRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md" | "lg";
  showValueLabel?: boolean;
}

function clamp(value: number): number {
  return Math.min(RATING_MAX, Math.max(RATING_MIN, value));
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function fillForBag(value: number, bagIndex: number): BagFill {
  if (value >= bagIndex + 1) return "full";
  if (value >= bagIndex + 0.5) return "half";
  return "empty";
}

function PopcornBag({ fill }: { fill: BagFill }) {
  return (
    <span className={styles.bag}>
      <svg viewBox="0 0 24 24" className={styles.bagOutline} aria-hidden="true">
        <path d={BAG_PATH} />
        <circle cx="8" cy="6" r="1.4" />
        <circle cx="12" cy="5" r="1.6" />
        <circle cx="16" cy="6" r="1.4" />
      </svg>
      {fill !== "empty" && (
        <span className={styles.bagFillClip} style={{ width: fill === "half" ? "50%" : "100%" }}>
          <svg viewBox="0 0 24 24" className={styles.bagFilled} aria-hidden="true">
            <path d={BAG_PATH} />
            <circle cx="8" cy="6" r="1.4" />
            <circle cx="12" cy="5" r="1.6" />
            <circle cx="16" cy="6" r="1.4" />
          </svg>
        </span>
      )}
    </span>
  );
}

export function PopcornRating({
  value,
  onChange,
  readOnly = false,
  size = "md",
  showValueLabel = false,
}: PopcornRatingProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const displayValue = hoverValue ?? value;
  const valueText = `${displayValue} out of ${RATING_MAX} bags`;

  function valueFromPointer(e: PointerEvent<HTMLDivElement>): number {
    const rect = containerRef.current!.getBoundingClientRect();
    const relativeX = clamp01((e.clientX - rect.left) / rect.width);
    return clamp(Math.ceil(relativeX * BAG_COUNT * 2) / 2);
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (readOnly) return;
    setHoverValue(valueFromPointer(e));
  }

  function handlePointerLeave() {
    setHoverValue(null);
  }

  function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
    if (readOnly) return;
    onChange?.(valueFromPointer(e));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (readOnly || !onChange) return;
    switch (e.key) {
      case "ArrowRight":
      case "ArrowUp":
        e.preventDefault();
        onChange(clamp(value + RATING_STEP));
        break;
      case "ArrowLeft":
      case "ArrowDown":
        e.preventDefault();
        onChange(clamp(value - RATING_STEP));
        break;
      case "Home":
        e.preventDefault();
        onChange(RATING_MIN);
        break;
      case "End":
        e.preventDefault();
        onChange(RATING_MAX);
        break;
    }
  }

  if (readOnly) {
    return (
      <div
        className={`${styles.rating} ${styles[size]}`}
        role="img"
        aria-label={`Rated ${valueText}`}
      >
        {Array.from({ length: BAG_COUNT }, (_, i) => (
          <PopcornBag key={i} fill={fillForBag(value, i)} />
        ))}
        {showValueLabel && <span className={styles.label}>{value}</span>}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`${styles.rating} ${styles[size]} ${styles.interactive}`}
      role="slider"
      tabIndex={0}
      aria-label="Rating"
      aria-valuemin={RATING_MIN}
      aria-valuemax={RATING_MAX}
      aria-valuenow={value}
      aria-valuetext={valueText}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
      onKeyDown={handleKeyDown}
    >
      {Array.from({ length: BAG_COUNT }, (_, i) => (
        <PopcornBag key={i} fill={fillForBag(displayValue, i)} />
      ))}
      {showValueLabel && <span className={styles.label}>{displayValue}</span>}
    </div>
  );
}
