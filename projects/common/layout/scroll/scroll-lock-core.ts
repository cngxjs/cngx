/**
 * Ref-count per document root. Module-private on purpose: this file is the
 * single owner of the lock state. A second copy of this map (the pre-extraction
 * state: one in `CngxScrollLock`, one in `CngxDialog`) shares the dataset keys
 * below without sharing the count, so interleaved acquire/release across the
 * two owners corrupts each other's saved overflow values.
 *
 * @internal
 */
const lockCounts = new WeakMap<HTMLElement, number>();

/**
 * Acquire a ref-counted scroll lock on a document root and get back the
 * matching release function.
 *
 * The first active lock saves the current `overflow` / `scrollbar-gutter`
 * inline styles and sets `overflow: hidden` + `scrollbar-gutter: stable`
 * (no layout shift when the scrollbar disappears). Releasing the last active
 * lock restores the saved values. The returned release function is
 * idempotent - calling it twice cannot over-decrement the count.
 *
 * Shared engine behind `CngxScrollLock` and `CngxDialog`'s modal scroll lock;
 * consumers composing their own overlay primitives can use it directly.
 *
 * ```typescript
 * const release = createScrollLock(document.documentElement);
 * // ... overlay open ...
 * release();
 * ```
 *
 * @param html - The document root (`document.documentElement`) to lock.
 * @returns Release function for this acquisition. Idempotent.
 *
 * @category common/layout
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/layout/scroll/scroll-lock-core.ts
 * @since 0.1.0
 * @relatedTo CngxScrollLock, CngxDialog
 */
export function createScrollLock(html: HTMLElement): () => void {
  const count = lockCounts.get(html) ?? 0;
  if (count === 0) {
    html.dataset['cngxPrevOverflow'] = html.style.overflow;
    html.dataset['cngxPrevScrollbarGutter'] = html.style.scrollbarGutter;
    html.style.overflow = 'hidden';
    html.style.scrollbarGutter = 'stable';
  }
  lockCounts.set(html, count + 1);

  let released = false;
  return () => {
    if (released) {
      return;
    }
    released = true;
    const current = lockCounts.get(html) ?? 0;
    if (current <= 1) {
      html.style.overflow = html.dataset['cngxPrevOverflow'] ?? '';
      html.style.scrollbarGutter = html.dataset['cngxPrevScrollbarGutter'] ?? '';
      delete html.dataset['cngxPrevOverflow'];
      delete html.dataset['cngxPrevScrollbarGutter'];
      lockCounts.set(html, 0);
    } else {
      lockCounts.set(html, current - 1);
    }
  };
}

interface PinState {
  count: number;
  readonly bodyCss: string;
  readonly scrollX: number;
  readonly scrollY: number;
  readonly releaseHtml: () => void;
}

/**
 * Pin state per document root, separate from `lockCounts`: a pin also holds
 * one `createScrollLock` acquisition, so the html overflow stays shared with
 * every other owner.
 *
 * @internal
 */
const pins = new WeakMap<HTMLElement, PinState>();

/**
 * Acquire a ref-counted scroll lock that pins the page body in place, for
 * overlays that must hold on iOS Safari.
 *
 * `overflow: hidden` on the root does not stop iOS Safari from scrolling a
 * page that was already scrolled, and the visual viewport drifts with it, so
 * a bottom-fixed overlay ends above the visible bottom. The first pin saves
 * the body's inline style and the scroll position, fixes the body at
 * `top: -scrollY`, and acquires {@link createScrollLock} on the root. The last
 * release restores the body, releases the root lock and scrolls back to the
 * saved position. The returned release function is idempotent.
 *
 * `CngxDialog` and `CngxScrollLock` keep {@link createScrollLock}; reach for
 * this one when the overlay is pinned to the viewport bottom on touch devices.
 *
 * ```typescript
 * const release = createPinnedScrollLock(document.documentElement);
 * // ... sheet open ...
 * release();
 * ```
 *
 * @param html - The document root (`document.documentElement`) to lock.
 * @returns Release function for this acquisition. Idempotent.
 *
 * @category common/layout
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/layout/scroll/scroll-lock-core.ts
 * @since 0.1.0
 * @relatedTo createScrollLock, CngxPopoverSheet
 */
export function createPinnedScrollLock(html: HTMLElement): () => void {
  const body = html.ownerDocument.body;
  const view = html.ownerDocument.defaultView;
  const existing = pins.get(html);
  if (existing) {
    existing.count += 1;
  } else {
    const scrollX = view?.scrollX ?? 0;
    const scrollY = view?.scrollY ?? 0;
    pins.set(html, {
      count: 1,
      bodyCss: body.style.cssText,
      scrollX,
      scrollY,
      releaseHtml: createScrollLock(html),
    });
    body.style.position = 'fixed';
    body.style.top = `${-scrollY}px`;
    body.style.insetInline = '0';
    body.style.overflow = 'hidden';
  }

  let released = false;
  return () => {
    if (released) {
      return;
    }
    released = true;
    const state = pins.get(html);
    if (!state) {
      return;
    }
    state.count -= 1;
    if (state.count > 0) {
      return;
    }
    pins.delete(html);
    body.style.cssText = state.bodyCss;
    state.releaseHtml();
    view?.scrollTo({ left: state.scrollX, top: state.scrollY, behavior: 'instant' });
  };
}
