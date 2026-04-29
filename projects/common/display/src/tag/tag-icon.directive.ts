import { Directive } from '@angular/core';

/**
 * Decorative icon slot for `CngxTag`. Restricts to `<svg>` and `<img>`
 * hosts via the selector — `aria-hidden="true"` is unconditional
 * (semantic meaning lives on the parent tag's text content) and the
 * `cngx-tag__icon` class hooks into the size/gap rules in `tag.css`.
 *
 * Usage:
 * ```html
 * <span cngxTag color="success">
 *   <svg cngxTagIcon viewBox="0 0 16 16" focusable="false">…</svg>
 *   Active
 * </span>
 * ```
 *
 * Pure decorator — no inputs, no outputs, no signals. The
 * narrowed selector pre-rejects non-icon hosts at compile time;
 * the spec contract `(c)` (`tag-icon.directive.spec.ts`) locks
 * that behaviour into CI.
 *
 * @category display
 */
@Directive({
  selector: 'svg[cngxTagIcon], img[cngxTagIcon]',
  exportAs: 'cngxTagIcon',
  standalone: true,
  host: {
    class: 'cngx-tag__icon',
    'aria-hidden': 'true',
  },
})
export class CngxTagIcon {}
