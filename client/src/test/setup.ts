import "@testing-library/jest-dom/vitest";

// jsdom doesn't implement PointerEvent (https://github.com/jsdom/jsdom/issues/2527);
// polyfill it on top of MouseEvent so fireEvent.pointerDown/Move carry clientX in tests.
if (typeof window !== "undefined" && !("PointerEvent" in window)) {
  class PointerEventPolyfill extends MouseEvent {
    pointerId?: number;
    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);
      this.pointerId = params.pointerId;
    }
  }
  // @ts-expect-error -- jsdom polyfill, not a full PointerEvent implementation
  window.PointerEvent = PointerEventPolyfill;
}
