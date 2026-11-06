/**
 * Ref-count per locked element. Module-private on purpose: this file is the
 * single owner of the lock state. A second copy of this map (the pre-extraction
 * state: one in `CngxScrollLock`, one in `CngxDialog`) shares the dataset keys
 * below without sharing the count, so interleaved acquire/release across the
 * two owners corrupts each other's saved overflow values.
 *
 * @internal
 */
const lockCounts = new WeakMap<HTMLElement, number>();

/**
 * Acquire a ref-counted scroll lock on an element and get back the matching
 * release function.
 *
 * The target is the element that scrolls: the document root
 * (`document.documentElement`) for the page, or any scroll container (a
 * panel with `overflow-y: auto`) for a surface that overlays only that
 * container. Each element keeps its own count, so locks on two containers
 * never interfere.
 *
 * The first active lock on a target saves its inline `overflow` /
 * `scrollbar-gutter` and sets `overflow: hidden` + `scrollbar-gutter: stable`
 * (no layout shift when the scrollbar disappears). Releasing the last active
 * lock on that target restores the saved values. The returned release
 * function is idempotent - calling it twice cannot over-decrement the count.
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
 * @param target - The scrolling element to lock.
 * @returns Release function for this acquisition. Idempotent.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/layout/scroll/scroll-lock-core.ts
 * @since 0.1.0
 * @relatedTo CngxScrollLock, CngxDialog
 */
export function createScrollLock(target: HTMLElement): () => void {
  const count = lockCounts.get(target) ?? 0;
  if (count === 0) {
    target.dataset['cngxPrevOverflow'] = target.style.overflow;
    target.dataset['cngxPrevScrollbarGutter'] = target.style.scrollbarGutter;
    target.style.overflow = 'hidden';
    target.style.scrollbarGutter = 'stable';
  }
  lockCounts.set(target, count + 1);

  let released = false;
  return () => {
    if (released) {
      return;
    }
    released = true;
    const current = lockCounts.get(target) ?? 0;
    if (current <= 1) {
      target.style.overflow = target.dataset['cngxPrevOverflow'] ?? '';
      target.style.scrollbarGutter = target.dataset['cngxPrevScrollbarGutter'] ?? '';
      delete target.dataset['cngxPrevOverflow'];
      delete target.dataset['cngxPrevScrollbarGutter'];
      lockCounts.set(target, 0);
    } else {
      lockCounts.set(target, current - 1);
    }
  };
}

// The body properties the pin writes. Only these are saved and restored, so a
// style another owner sets on body while the pin is held survives the release.
const PINNED_BODY_PROPERTIES = ['position', 'top', 'inset-inline', 'overflow'] as const;

interface SavedProperty {
  readonly value: string;
  readonly priority: string;
}

interface PinState {
  count: number;
  readonly saved: ReadonlyMap<string, SavedProperty>;
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
 * the body's inline `position`, `top`, `inset-inline` and `overflow` and the
 * scroll position, fixes the body at `top: -scrollY`, and acquires
 * {@link createScrollLock} on the root. The last
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
      saved: new Map(
        PINNED_BODY_PROPERTIES.map((name) => [
          name,
          {
            value: body.style.getPropertyValue(name),
            priority: body.style.getPropertyPriority(name),
          },
        ]),
      ),
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
    for (const [name, { value, priority }] of state.saved) {
      if (value) {
        body.style.setProperty(name, value, priority);
      } else {
        body.style.removeProperty(name);
      }
    }
    state.releaseHtml();
    view?.scrollTo({ left: state.scrollX, top: state.scrollY, behavior: 'instant' });
  };
}
