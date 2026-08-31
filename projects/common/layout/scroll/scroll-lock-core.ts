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
