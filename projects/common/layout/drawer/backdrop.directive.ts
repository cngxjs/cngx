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
 * The directive is purely behavioral - it toggles the
 * `.cngx-backdrop--visible` class and `aria-hidden` attribute. Visual
 * styling is opt-in: either consume the shipped default stylesheet or
 * provide your own.
 *
 * ### Drawer backdrop with shipped defaults (recommended)
 * ```html
 * <div cngxDrawer #drawer="cngxDrawer">
 *   <div [cngxBackdrop]="drawer.opened()" (backdropClick)="drawer.close()"
 *        class="cngx-backdrop"></div>
 *   <nav [cngxDrawerPanel]="drawer">…</nav>
 *   <main [cngxDrawerContent]="drawer">…</main>
 * </div>
 * ```
 * ```css
 * @import '@cngx/common/theming/components/cngx-backdrop.css';
 * ```
 *
 * Token surface (Three-Tier-Override):
 * - `--cngx-backdrop-bg` (scrim color, default `oklch(0 0 0 / 0.5)`)
 * - `--cngx-backdrop-transition-duration` (default `200ms`)
 *
 * ### Custom styling (no opt-in class)
 * If the shipped defaults don't fit, omit the `.cngx-backdrop` class and
 * style your own host class - the directive still toggles
 * `.cngx-backdrop--visible` on the host element.
 *
 * ```html
 * <div [cngxBackdrop]="visible()" class="my-backdrop"></div>
 * ```
 * ```css
 * .my-backdrop {
 *   position: fixed;
 *   inset: 0;
 *   background: rgba(0, 0, 0, 0.3);
 *   opacity: 0;
 *   pointer-events: none;
 *   transition: opacity 0.25s ease;
 * }
 * .my-backdrop.cngx-backdrop--visible {
 *   opacity: 1;
 *   pointer-events: auto;
 * }
 * ```
 *
 * @category common/layout
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/layout/drawer/backdrop.directive.ts
 * @since 0.1.0
 * @relatedTo CngxDrawer, CngxDrawerPanel, CngxScrollLock
 * <example-url>http://localhost:4200/#/common/layout/backdrop/overlay-with-inert</example-url>
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
