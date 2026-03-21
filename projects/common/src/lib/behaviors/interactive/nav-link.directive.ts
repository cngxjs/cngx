import { Directive, input } from '@angular/core';

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
    '[style.--cngx-nav-depth]': 'depth()',
  },
})
export class CngxNavLink {
  /** Whether this link is the currently active route/item. */
  readonly active = input<boolean>(false);

  /** Nesting depth for indentation. Consumer sets manually — no ancestor injection. */
  readonly depth = input<number>(0);
}
