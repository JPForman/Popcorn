import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PopcornRating } from "./PopcornRating";

function mockRect(width: number): DOMRect {
  return {
    left: 0,
    right: width,
    width,
    top: 0,
    bottom: 24,
    height: 24,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  };
}

describe("PopcornRating", () => {
  it("renders readOnly as an img with a descriptive label", () => {
    render(<PopcornRating value={4.5} readOnly />);
    expect(screen.getByRole("img", { name: /rated 4.5 out of 6 bags/i })).toBeInTheDocument();
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
  });

  it("renders interactive as a slider with correct ARIA attributes", () => {
    render(<PopcornRating value={3} onChange={() => {}} />);
    const slider = screen.getByRole("slider");
    expect(slider).toHaveAttribute("aria-valuemin", "0");
    expect(slider).toHaveAttribute("aria-valuemax", "6");
    expect(slider).toHaveAttribute("aria-valuenow", "3");
    expect(slider).toHaveAttribute("tabindex", "0");
  });

  it("supports keyboard navigation in half-bag steps", () => {
    const handleChange = vi.fn();
    render(<PopcornRating value={3} onChange={handleChange} />);
    const slider = screen.getByRole("slider");

    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(handleChange).toHaveBeenCalledWith(3.5);

    fireEvent.keyDown(slider, { key: "ArrowLeft" });
    expect(handleChange).toHaveBeenCalledWith(2.5);

    fireEvent.keyDown(slider, { key: "Home" });
    expect(handleChange).toHaveBeenCalledWith(0);

    fireEvent.keyDown(slider, { key: "End" });
    expect(handleChange).toHaveBeenCalledWith(6);
  });

  it("clamps keyboard navigation at the bounds", () => {
    const handleChange = vi.fn();
    render(<PopcornRating value={0} onChange={handleChange} />);
    fireEvent.keyDown(screen.getByRole("slider"), { key: "ArrowLeft" });
    expect(handleChange).toHaveBeenCalledWith(0);
  });

  it("maps a pointer click position to the correct half/full bag value", () => {
    const handleChange = vi.fn();
    render(<PopcornRating value={0} onChange={handleChange} />);
    const slider = screen.getByRole("slider");
    slider.getBoundingClientRect = () => mockRect(120);

    // 120px / 6 bags = 20px/bag. clientX=35 falls in the right half of bag index 1 -> full 2 bags.
    fireEvent.pointerDown(slider, { clientX: 35 });
    expect(handleChange).toHaveBeenCalledWith(2);

    // clientX=25 falls in the left half of bag index 1 -> half at 1.5.
    fireEvent.pointerDown(slider, { clientX: 25 });
    expect(handleChange).toHaveBeenCalledWith(1.5);
  });

  it("ignores pointer and keyboard interaction when readOnly", () => {
    const handleChange = vi.fn();
    render(<PopcornRating value={2} onChange={handleChange} readOnly />);
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
  });
});
