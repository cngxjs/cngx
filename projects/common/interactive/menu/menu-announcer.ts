import { DOCUMENT } from '@angular/common';
import { inject, Injectable, InjectionToken } from '@angular/core';

/**
 * Public surface every menu-side consumer talks to. The class
 * `CngxMenuAnnouncer` is the default implementation; consumers wire a
 * custom (telemetry-wrapping, locale-aware, test-doubled) one by
 * overriding `CNGX_MENU_ANNOUNCER_FACTORY`.
 *
 * @category interactive
 */
export interface CngxMenuAnnouncerLike {
  announce(message: string): void;
}

/**
 * Factory shape consumed by `CNGX_MENU_ANNOUNCER_FACTORY`. The default
 * factory is {@link createMenuAnnouncer}; override returns any object
 * that satisfies {@link CngxMenuAnnouncerLike}.
 *
 * @category interactive
 */
export type CngxMenuAnnouncerFactory = () => CngxMenuAnnouncerLike;

/**
 * Global polite live-region announcer for the menu family. Maintains a
 * single hidden `aria-live="polite"` element per document and announces
 * menu state transitions (submenu open/close, item activation).
 *
 * Scoped `providedIn: 'root'` so every menu in the app shares the same
 * region; messages are de-duped via a short clear-then-set cycle so
 * screen readers treat repeated identical messages as fresh events.
 *
 * Default factory output for {@link CNGX_MENU_ANNOUNCER_FACTORY}.
 * Consumers obtain the announcer via the factory token, never by
 * `inject(CngxMenuAnnouncer)` directly, so a swap is enterprise-wide.
 *
 * @category interactive
 */
@Injectable({ providedIn: 'root' })
export class CngxMenuAnnouncer implements CngxMenuAnnouncerLike {
  private readonly doc = inject(DOCUMENT);
  private politeElement: HTMLElement | null = null;
  private clearTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Announce a message via the polite live region. Empty messages are
   * ignored. The region is cleared ~16ms before being repopulated so AT
   * picks up identical-text repeats as a new event.
   */
  announce(message: string): void {
    if (!message) {
      return;
    }
    const element = this.ensureRegion();
    if (!element) {
      return;
    }
    element.textContent = '';
    if (this.clearTimer) {
      clearTimeout(this.clearTimer);
    }
    this.clearTimer = setTimeout(() => {
      element.textContent = message;
      this.clearTimer = null;
    }, 16);
  }

  private ensureRegion(): HTMLElement | null {
    if (this.politeElement) {
      return this.politeElement;
    }
    const body = this.doc.body;
    if (!body) {
      return null;
    }
    const el = this.doc.createElement('div');
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('role', 'status');
    el.setAttribute('aria-atomic', 'true');
    el.className = 'cngx-menu-announcer';
    el.style.cssText =
      'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0';
    body.appendChild(el);
    this.politeElement = el;
    return el;
  }
}

/**
 * Default factory that hands out the root-scoped {@link CngxMenuAnnouncer}
 * singleton. Consumers wire a custom announcer by replacing
 * {@link CNGX_MENU_ANNOUNCER_FACTORY}.
 *
 * Must run inside an injection context.
 *
 * @category interactive
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
 * @example
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
 * @category interactive
 */
export const CNGX_MENU_ANNOUNCER_FACTORY = new InjectionToken<CngxMenuAnnouncerFactory>(
  'CNGX_MENU_ANNOUNCER_FACTORY',
  { providedIn: 'root', factory: () => createMenuAnnouncer },
);

/**
 * Resolve the {@link CngxMenuAnnouncerLike} from the current injection
 * scope via the factory token. Must run inside an injection context.
 *
 * @category interactive
 */
export function injectMenuAnnouncer(): CngxMenuAnnouncerLike {
  return inject(CNGX_MENU_ANNOUNCER_FACTORY)();
}
