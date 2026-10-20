/**
 * Puts jsdom under a coarse pointer for the select touch-floor signal: the
 * `(any-pointer: coarse)` query matches, every other query keeps what the
 * environment answered before. jsdom has no `ResizeObserver` entries, so the
 * signal stays on its media fallback and reads `true`. Call before the
 * component is created; the returned function restores the previous
 * `matchMedia`.
 *
 * @internal
 */
export function stubTouchFloor(): () => void {
  const win = window as { matchMedia?: (query: string) => MediaQueryList };
  const previous = win.matchMedia;
  win.matchMedia = (query: string) =>
    ({
      matches:
        query === '(any-pointer: coarse)' || (previous?.call(window, query).matches ?? false),
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList;
  return () => {
    if (previous) {
      win.matchMedia = previous;
    } else {
      delete win.matchMedia;
    }
  };
}
