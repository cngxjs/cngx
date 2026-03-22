import { afterNextRender, Directive, ElementRef, inject, input, signal } from '@angular/core';

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
 */
@Directive({
  selector: 'a[cngxNavLink], button[cngxNavLink]',
  exportAs: 'cngxNavLink',
  standalone: true,
  host: {
    '[class.cngx-nav-link]': 'true',
    '[class.cngx-nav-link--active]': 'active()',
    '[attr.aria-current]': "active() ? ariaCurrent() : null",
    '[attr.tabindex]': '_needsFocusFix() ? 0 : null',
    '[attr.role]': "_needsFocusFix() ? 'link' : null",
    '[style.--cngx-nav-depth]': 'depth()',
  },
})
export class CngxNavLink {
  /**
   * Whether the host `<a>` lacks an `href` and needs `tabindex="0"` + `role="link"`
   * for focusability. Checked after render so Angular bindings like `[href]` are applied.
   * @internal
   */
  readonly _needsFocusFix = signal(false);

  constructor() {
    const el = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
    if (el.tagName === 'A') {
      // Check after Angular has applied attribute bindings
      afterNextRender(() => {
        this._needsFocusFix.set(!el.hasAttribute('href'));
      });
    }

    // Set data-initial from text content for mini-mode first-letter display.
    // Runs after render so projected content is available.
    afterNextRender(() => {
      const text = el.textContent?.trim();
      if (text && !el.hasAttribute('data-initial')) {
        el.setAttribute('data-initial', text.charAt(0).toUpperCase());
      }
    });
  }

  /** Whether this link is the currently active route/item. */
  readonly active = input<boolean>(false);

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
