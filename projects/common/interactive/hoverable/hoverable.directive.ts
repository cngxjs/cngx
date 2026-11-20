import { Directive, signal } from '@angular/core';

/**
 * Tracks whether the host element is currently hovered via mouse pointer.
 *
 * Touch does not hover: after a touch contact on the host the `mouseenter`
 * a browser emulates for the tap is ignored, so a tapped host does not stay
 * hovered. The next mouse or pen pointer on the host lifts that again.
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
    '(pointerenter)': 'notePointer($event)',
    '(pointerdown)': 'notePointer($event)',
    '(mouseenter)': 'handleMouseEnter()',
    '(mouseleave)': 'handleMouseLeave()',
  },
})
export class CngxHoverable {
  /** Backing state for {@link hovered}. */
  private readonly hoveredState = signal(false);

  /** `true` while the pointer is over the host element. */
  readonly hovered = this.hoveredState.asReadonly();

  /** Whether the last pointer on the host was a touch contact. */
  private touchContact = false;

  /** @internal - records the pointer type so emulated mouse events after a tap can be told apart. */
  protected notePointer(event: PointerEvent): void {
    this.touchContact = event.pointerType === 'touch';
  }

  /** @internal - a tap has no hover; the mouseenter a browser emulates after it is ignored. */
  protected handleMouseEnter(): void {
    if (this.touchContact) {
      return;
    }
    this.hoveredState.set(true);
  }

  protected handleMouseLeave(): void {
    this.hoveredState.set(false);
  }
}
