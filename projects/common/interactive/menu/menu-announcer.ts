import { inject, Injectable, InjectionToken } from '@angular/core';

import { CngxLiveAnnouncer } from '@cngx/common/a11y';

/**
 * Public surface every menu-side consumer talks to. The class
 * `CngxMenuAnnouncer` is the default implementation; consumers wire a
 * custom (telemetry-wrapping, locale-aware, test-doubled) one by
 * overriding `CNGX_MENU_ANNOUNCER_FACTORY`.
 *
 * @category common/interactive/menu
 */
export interface CngxMenuAnnouncerLike {
  announce(message: string): void;
}

/**
 * Factory shape consumed by `CNGX_MENU_ANNOUNCER_FACTORY`. The default
 * factory is {@link createMenuAnnouncer}; override returns any object
 * that satisfies {@link CngxMenuAnnouncerLike}.
 *
 * @category common/interactive/menu
 */
export type CngxMenuAnnouncerFactory = () => CngxMenuAnnouncerLike;

/**
 * Global polite live-region announcer for the menu family. Delegates to
 * the shared {@link CngxLiveAnnouncer}, announcing menu state transitions
 * (submenu open/close, item activation) through its polite region.
 *
 * Scoped `providedIn: 'root'` so every menu in the app shares the same
 * region; the announcer clears then re-sets one frame later so screen
 * readers treat repeated identical messages as fresh events.
 *
 * Default factory output for {@link CNGX_MENU_ANNOUNCER_FACTORY}.
 * Consumers obtain the announcer via the factory token, never by
 * `inject(CngxMenuAnnouncer)` directly, so a swap is enterprise-wide.
 *
 * @category common/interactive/menu
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/menu/menu-announcer.ts
 * @since 0.1.0
 * @relatedTo CngxMenu, CngxMenuTrigger, CngxMenuItemSubmenu
 */
@Injectable({ providedIn: 'root' })
export class CngxMenuAnnouncer implements CngxMenuAnnouncerLike {
  private readonly announcer = inject(CngxLiveAnnouncer);

  /**
   * Announce a message via the polite live region. Empty messages are
   * ignored. The region is cleared ~16ms before being repopulated so AT
   * picks up identical-text repeats as a new event.
   */
  announce(message: string): void {
    if (!message) {
      return;
    }
    this.announcer.announce(message, 'polite');
  }
}

/**
 * Default factory that hands out the root-scoped {@link CngxMenuAnnouncer}
 * singleton. Consumers wire a custom announcer by replacing
 * {@link CNGX_MENU_ANNOUNCER_FACTORY}.
 *
 * Must run inside an injection context.
 *
 * @category common/interactive/menu
 */
export function createMenuAnnouncer(): CngxMenuAnnouncerLike {
  return inject(CngxMenuAnnouncer);
}

/**
 * DI token carrying the factory that yields the menu family's announcer.
 * Defaults to {@link createMenuAnnouncer} returning the root-scoped
 * {@link CngxMenuAnnouncer} singleton. Override via `providers` /
 * `viewProviders` for telemetry-wrapping, locale-aware, or test-doubled
 * announcers without forking the menu module. Symmetric to
 * `CNGX_COMMIT_ERROR_ANNOUNCER_FACTORY` from the select family.
 *
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     {
 *       provide: CNGX_MENU_ANNOUNCER_FACTORY,
 *       useValue: () => ({ announce: (msg) => myTelemetry.log(msg) }),
 *     },
 *   ],
 * });
 * ```
 *
 * @category common/interactive/menu
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/menu/menu-announcer.ts
 * @since 0.1.0
 */
export const CNGX_MENU_ANNOUNCER_FACTORY = new InjectionToken<CngxMenuAnnouncerFactory>(
  'CNGX_MENU_ANNOUNCER_FACTORY',
  { providedIn: 'root', factory: () => createMenuAnnouncer },
);

/**
 * Resolve the {@link CngxMenuAnnouncerLike} from the current injection
 * scope via the factory token. Must run inside an injection context.
 *
 * @category common/interactive/menu
 */
export function injectMenuAnnouncer(): CngxMenuAnnouncerLike {
  return inject(CNGX_MENU_ANNOUNCER_FACTORY)();
}
