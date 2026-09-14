import { Directive, signal } from '@angular/core';

/**
 * Tracks whether the host element is currently hovered via mouse pointer.
 *
 * @category common/interactive
 *
 * Designed as a `hostDirective` composition primitive - attach it to
 * components that need hover state without implementing their own
 * mouseenter/mouseleave logic. Host components read the read-only
 * `hovered` signal via `inject(CngxHoverable, { host: true })`; the
 * pointer events are the only writers.
 *
 * Used internally by `CngxTreetableRow` for row highlight-on-hover.
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
 * @docsKind primary
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/hoverable/hoverable.directive.ts
 * @since 0.1.0
 * @relatedTo CngxPressable, CngxRipple
 */
@Directive({
  selector: '[cngxHoverable]',
  standalone: true,
  exportAs: 'cngxHoverable',
  host: {
    '(mouseenter)': 'handleMouseEnter()',
    '(mouseleave)': 'handleMouseLeave()',
  },
})
export class CngxHoverable {
  /** Backing state for {@link hovered}. */
  private readonly hoveredState = signal(false);

  /** `true` while the pointer is over the host element. */
  readonly hovered = this.hoveredState.asReadonly();

  protected handleMouseEnter(): void {
    this.hoveredState.set(true);
  }

  protected handleMouseLeave(): void {
    this.hoveredState.set(false);
  }
}
