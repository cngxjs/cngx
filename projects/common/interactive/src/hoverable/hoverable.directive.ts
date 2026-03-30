import { Directive, signal } from '@angular/core';

/**
 * Tracks whether the host element is currently hovered via mouse pointer.
 *
 * Designed as a `hostDirective` composition primitive — attach it to
 * components that need hover state without implementing their own
 * mouseenter/mouseleave logic. The `hovered` signal is writable so
 * host components can read it via `inject(CngxHoverable, { host: true })`.
 *
 * Used internally by `CngxTreetableRow` for row highlight-on-hover.
 *
 * @usageNotes
 *
 * ### As hostDirective
 * ```typescript
 * @Component({
 *   hostDirectives: [{ directive: CngxHoverable }],
 * })
 * export class MyCard {
 *   private readonly hover = inject(CngxHoverable, { host: true });
 *   readonly isHovered = this.hover.hovered; // Signal<boolean>
 * }
 * ```
 *
 * ### Standalone
 * ```html
 * <div cngxHoverable #h="cngxHoverable" [class.highlight]="h.hovered()">
 *   Hover me
 * </div>
 * ```
 *
 * @category interactive
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
