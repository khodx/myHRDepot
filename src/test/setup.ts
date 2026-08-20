import '@testing-library/jest-dom/vitest';

// jsdom has no layout engine and doesn't implement ResizeObserver. Components
// that measure their own size (e.g. shrink-to-fit text) need this stub to
// avoid a ReferenceError in tests; it never actually fires (no real layout).
if (typeof globalThis.ResizeObserver === 'undefined') {
  class MhdNoopResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = MhdNoopResizeObserver as unknown as typeof ResizeObserver;
}
