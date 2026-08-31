/**
 * Apply the visually-hidden (screen-reader-only) recipe to a dynamically
 * created dialog node.
 *
 * Inline styles instead of relying on the `cngx-sr-only` class alone so the
 * live region and the drag instruction stay hidden even when no cngx
 * stylesheet is loaded. The node remains perceivable to AT - describedby
 * targets and live regions must never be `display: none`.
 *
 * Internal helper - intentionally not exported from `public-api.ts`.
 */
export function applySrOnly(el: HTMLElement): void {
  el.className = 'cngx-sr-only';
  el.style.position = 'absolute';
  el.style.width = '1px';
  el.style.height = '1px';
  el.style.padding = '0';
  el.style.margin = '-1px';
  el.style.overflow = 'hidden';
  el.style.clip = 'rect(0, 0, 0, 0)';
  el.style.whiteSpace = 'nowrap';
  el.style.border = '0';
}
