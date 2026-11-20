import { Directive, signal } from '@angular/core';

/**
 * Tracks whether the host element is currently hovered by a mouse or pen.
 *
 * Listens to `pointerenter` / `pointerleave` (the same events as
 * `CngxHoverIntent`) and ignores touch: a tap has no hover, and the
 * emulated `mouseenter` a browser sends after a tap would otherwise leave
 * the state stuck on `true`.
 *
 * Designed as a `hostDirective` composition primitive - attach it to
 * components that need hover state without implementing their own
 * pointer-event logic. Host components read the read-only
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
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/hoverable/hoverable.directive.ts
 * @since 0.1.0
 * @relatedTo CngxPressable, CngxRipple
 * @axis level atom
 */
@Directive({
  selector: '[cngxHoverable]',
  standalone: true,
  exportAs: 'cngxHoverable',
  host: {
    '(pointerenter)': 'handlePointerEnter($event)',
    '(pointerleave)': 'handlePointerLeave()',
  },
})
export class CngxHoverable {
  /** Backing state for {@link hovered}. */
  private readonly hoveredState = signal(false);

  /** `true` while the pointer is over the host element. */
  readonly hovered = this.hoveredState.asReadonly();

  /** @internal - touch has no hover; a tap must not leave a sticky hovered state. */
  protected handlePointerEnter(event: PointerEvent): void {
    if (event.pointerType === 'touch') {
      return;
    }
    this.hoveredState.set(true);
  }

  /** @internal */
  protected handlePointerLeave(): void {
    this.hoveredState.set(false);
  }
}
