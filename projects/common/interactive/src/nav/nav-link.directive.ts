import {
  afterNextRender,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  signal,
} from '@angular/core';

/**
 * Navigation link atom. Applied to `<a>` or `<button>` elements in a
 * sidebar or nav menu.
 *
 * Sets a `--cngx-nav-depth` CSS custom property for indentation and
 * toggles an `active` class. Does NOT depend on `@angular/router` —
 * the consumer wires `routerLinkActive` or binds `[active]` manually.
 *
 * @usageNotes
 *
 * ### With Router
 * ```html
 * <a cngxNavLink routerLink="/dashboard" routerLinkActive
 *    #rla="routerLinkActive" [active]="rla.isActive">
 *   Dashboard
 * </a>
 * ```
 *
 * ### Manual active state
 * ```html
 * <a cngxNavLink [active]="currentRoute() === '/settings'" href="/settings">
 *   Settings
 * </a>
 * ```
 *
 * ### Nested (depth-based indentation)
 * ```html
 * <a cngxNavLink [depth]="0">Top level</a>
 * <a cngxNavLink [depth]="1">Nested</a>
 * <a cngxNavLink [depth]="2">Deep nested</a>
 * ```
 *
 * @category nav
 */
@Directive({
  selector: 'a[cngxNavLink], button[cngxNavLink]',
  exportAs: 'cngxNavLink',
  standalone: true,
  host: {
    '[class.cngx-nav-link]': 'true',
    '[class.cngx-nav-link--active]': 'active()',
    '[attr.aria-current]': 'active() ? ariaCurrent() : null',
    '[attr.tabindex]': 'needsFocusFix() ? 0 : null',
    '[attr.role]': "needsFocusFix() ? 'link' : null",
    '[style.--cngx-nav-depth]': 'depth()',
  },
})
export class CngxNavLink {
  /**
   * `true` when the host `<a>` lacks an `href` attribute and needs `tabindex="0"`
   * + `role="link"` for keyboard focusability.
   *
   * Evaluated after the first render so Angular bindings such as `[href]` are
   * already resolved before the check runs.
   */
  readonly needsFocusFix = signal(false);

  private readonly initialized = signal(false);

  constructor() {
    const el = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;

    afterNextRender(() => {
      if (el.tagName === 'A') {
        this.needsFocusFix.set(!el.hasAttribute('href'));
      }
      const text = el.textContent?.trim();
      if (text && !Object.hasOwn(el.dataset, 'initial')) {
        el.dataset['initial'] = text.charAt(0).toUpperCase();
      }
      this.initialized.set(true);
    });

    // Scroll into view when becoming active (e.g., after route change).
    // Skips the initial render to avoid scroll jank on page load.
    effect(() => {
      if (!this.initialized() || !this.active() || !this.scrollOnActive()) {
        return;
      }
      el.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
    });
  }

  /** Whether this link is the currently active route/item. */
  readonly active = input<boolean>(false);

  /** Whether to scroll this link into view when it becomes active. */
  readonly scrollOnActive = input<boolean>(true);

  /**
   * The `aria-current` value when active. Screen readers announce this
   * to indicate the current page/step/location.
   *
   * Common values: `'page'` (default), `'step'`, `'location'`, `'true'`.
   */
  readonly ariaCurrent = input<string>('page');

  /** Nesting depth for indentation. Consumer sets manually — no ancestor injection. */
  readonly depth = input<number>(0);
}
