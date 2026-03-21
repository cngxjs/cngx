import { DestroyRef, Directive, effect, inject, input } from '@angular/core';
import { CngxDisclosure } from './disclosure.directive';
import { CNGX_NAV_CONFIG, CNGX_NAV_DEFAULTS } from './nav-config';
import { CngxNavGroupRegistry } from './nav-group-registry';

/**
 * Navigation accordion group — a collapsible section in a sidebar nav.
 *
 * Composes `CngxDisclosure` as a `hostDirective` for expand/collapse behavior.
 * Adds nav-specific semantics: depth tracking and CSS classes for styling.
 *
 * When `CNGX_NAV_CONFIG` is provided with `singleAccordion: true` and a
 * `CngxNavGroupRegistry` is in scope, opening this group closes all other
 * groups registered in the same registry.
 *
 * Applied to the **trigger** element (the group header button).
 * The consumer renders the content separately and wires `role="group"`
 * and `aria-labelledby` on the content container.
 *
 * @usageNotes
 *
 * ### Basic
 * ```html
 * <button cngxNavGroup #group="cngxNavGroup" [controls]="'settings-nav'"
 *         [depth]="0" id="settings-label">
 *   Settings
 * </button>
 * @if (group.disclosure.opened()) {
 *   <div id="settings-nav" role="group" [attr.aria-labelledby]="'settings-label'">
 *     <a cngxNavLink [depth]="1">General</a>
 *     <a cngxNavLink [depth]="1">Security</a>
 *   </div>
 * }
 * ```
 *
 * ### Single-accordion mode
 * ```typescript
 * @Component({
 *   providers: [
 *     provideNavConfig({ singleAccordion: true }),
 *     CngxNavGroupRegistry,
 *   ],
 * })
 * ```
 */
@Directive({
  selector: '[cngxNavGroup]',
  exportAs: 'cngxNavGroup',
  standalone: true,
  hostDirectives: [
    {
      directive: CngxDisclosure,
      inputs: ['cngxDisclosureOpened', 'controls'],
      outputs: ['openedChange'],
    },
  ],
  host: {
    '[class.cngx-nav-group]': 'true',
    '[class.cngx-nav-group--open]': 'disclosure.opened()',
    '[style.--cngx-nav-depth]': 'depth()',
  },
})
export class CngxNavGroup {
  /** The composed disclosure instance — use `disclosure.opened()` to read state. */
  readonly disclosure = inject(CngxDisclosure, { host: true });

  /** Nesting depth for indentation. Consumer sets manually. */
  readonly depth = input<number>(0);

  private readonly _registry = inject(CngxNavGroupRegistry, { optional: true });
  private readonly _config = inject(CNGX_NAV_CONFIG, { optional: true });

  constructor() {
    this._registry?.register(this);
    inject(DestroyRef).onDestroy(() => this._registry?.unregister(this));

    const singleAccordion = this._config?.singleAccordion ?? CNGX_NAV_DEFAULTS.singleAccordion;
    const registry = this._registry;
    if (singleAccordion && registry) {
      effect(() => {
        if (this.disclosure.opened()) {
          registry.closeOthers(this);
        }
      });
    }
  }
}
