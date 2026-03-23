import { Directive, effect, ElementRef, inject, input, output } from '@angular/core';

/**
 * Manages backdrop overlay behavior: visibility, click-to-close, and
 * `inert` toggling on sibling elements.
 *
 * When visible, all sibling elements of the host receive the `inert`
 * attribute, preventing focus and interaction behind the backdrop.
 * This is critical for a11y in modal/drawer overlays.
 *
 * The directive is purely behavioral -- the consumer provides all
 * visual styling (background color, opacity, transitions) via CSS
 * custom properties and the `.cngx-backdrop--visible` class.
 *
 * @usageNotes
 *
 * ### Drawer backdrop
 * ```html
 * <div cngxDrawer #drawer="cngxDrawer">
 *   <div [cngxBackdrop]="drawer.opened()" (backdropClick)="drawer.close()"
 *        class="my-backdrop"></div>
 *   <nav [cngxDrawerPanel]="drawer">…</nav>
 *   <main [cngxDrawerContent]="drawer">…</main>
 * </div>
 * ```
 *
 * ### CSS (consumer responsibility)
 * ```css
 * .my-backdrop {
 *   position: fixed;
 *   inset: 0;
 *   background: var(--cngx-backdrop-color, rgba(0, 0, 0, 0.5));
 *   opacity: 0;
 *   pointer-events: none;
 *   transition: opacity 0.25s ease;
 * }
 * .my-backdrop.cngx-backdrop--visible {
 *   opacity: 1;
 *   pointer-events: auto;
 * }
 * ```
 */
@Directive({
  selector: '[cngxBackdrop]',
  exportAs: 'cngxBackdrop',
  standalone: true,
  host: {
    '[class.cngx-backdrop--visible]': 'visible()',
    '[attr.aria-hidden]': '!visible()',
    '(click)': 'onHostClick()',
  },
})
export class CngxBackdrop {
  /** Whether the backdrop is visible and siblings are inert. */
  readonly visible = input<boolean>(false, { alias: 'cngxBackdrop' });
  /** Whether clicking the backdrop emits `backdropClick`. */
  readonly closeOnClick = input<boolean>(true);
  /** Emitted when the backdrop is clicked (and `closeOnClick` is true). */
  readonly backdropClick = output<void>();

  private readonly _el = inject(ElementRef<HTMLElement>);

  constructor() {
    // Cache siblings once on first effect run (DOM is available at this point).
    let siblings: HTMLElement[] | null = null;

    effect(() => {
      if (!siblings) {
        const el = this._el.nativeElement as HTMLElement;
        const parent = el.parentElement;
        siblings = parent
          ? Array.from(parent.children).filter(
              (child): child is HTMLElement => child !== el && child instanceof HTMLElement,
            )
          : [];
      }
      if (this.visible()) {
        siblings.forEach((el) => el.setAttribute('inert', ''));
      } else {
        siblings.forEach((el) => el.removeAttribute('inert'));
      }
    });
  }

  /** @internal */
  protected onHostClick(): void {
    if (this.visible() && this.closeOnClick()) {
      this.backdropClick.emit();
    }
  }
}
