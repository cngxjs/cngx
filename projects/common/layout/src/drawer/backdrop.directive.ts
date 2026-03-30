import {
  afterNextRender,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

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
    '(click)': 'handleHostClick()',
  },
})
export class CngxBackdrop {
  /** Whether the backdrop is visible and siblings are inert. */
  readonly visible = input<boolean>(false, { alias: 'cngxBackdrop' });
  /** Whether clicking the backdrop emits `backdropClick`. */
  readonly closeOnClick = input<boolean>(true);
  /** Emitted when the backdrop is clicked (and `closeOnClick` is true). */
  readonly backdropClick = output<void>();

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly siblings = signal<HTMLElement[]>([]);

  constructor() {
    afterNextRender(() => {
      const el = this.el.nativeElement as HTMLElement;
      const parent = el.parentElement;
      this.siblings.set(
        parent
          ? Array.from(parent.children).filter(
              (child): child is HTMLElement => child !== el && child instanceof HTMLElement,
            )
          : [],
      );
    });

    effect(() => {
      const visible = this.visible();
      this.siblings().forEach((el) =>
        visible ? el.setAttribute('inert', '') : el.removeAttribute('inert'),
      );
    });
  }

  /** @internal */
  protected handleHostClick(): void {
    if (this.visible() && this.closeOnClick()) {
      this.backdropClick.emit();
    }
  }
}
