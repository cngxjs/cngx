import { Directive, signal } from '@angular/core';

/**
 * Tracks whether the host element is currently hovered.
 * Intended for use as a `hostDirective` composition primitive.
 *
 * Exposes a single readonly signal {@link hovered} that becomes `true` on
 * `mouseenter` and `false` on `mouseleave`.
 */
@Directive({
  selector: '[cngxHoverable]',
  standalone: true,
  exportAs: 'cngxHoverable',
  host: {
    '(mouseenter)': 'hovered.set(true)',
    '(mouseleave)': 'hovered.set(false)',
  },
})
export class CngxHoverable {
  /** `true` while the pointer is over the host element. */
  readonly hovered = signal(false);
}
