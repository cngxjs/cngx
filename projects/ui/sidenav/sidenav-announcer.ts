import { ElementRef, inject, InjectionToken, untracked } from '@angular/core';
import { CngxLiveAnnouncer } from '@cngx/common/a11y';

import { injectSidenavLabels } from './config/inject-sidenav-config';

/**
 * Speaks the state a toggle hotkey left the sidenav in. A hotkey has no
 * focused trigger whose `aria-expanded` would convey the change, so the
 * rail announces it.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/sidenav/sidenav-announcer.ts
 * @since 0.1.0
 * @relatedTo CNGX_SIDENAV_ANNOUNCER_FACTORY, createSidenavAnnouncer
 */
export interface CngxSidenavAnnouncer {
  /** Announces the full nav as shown (`true`) or hidden (`false`). */
  announce(expanded: boolean): void;
}

/**
 * Default sidenav announcer: the `collapsedAnnouncement` /
 * `expandedAnnouncement` copy (`withSidenavLabels`, then the language pack)
 * through the root `CngxLiveAnnouncer`, scoped to the rail so an open modal
 * overlay still reads it. The copy is read untracked at announce time, so a
 * language switch never re-speaks a message. Injection context required.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/sidenav/sidenav-announcer.ts
 * @since 0.1.0
 * @relatedTo CNGX_SIDENAV_ANNOUNCER_FACTORY, CngxLiveAnnouncer
 */
export function createSidenavAnnouncer(): CngxSidenavAnnouncer {
  const live = inject(CngxLiveAnnouncer);
  const labels = injectSidenavLabels();
  const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  return {
    announce: (expanded) => {
      const message = untracked(() =>
        expanded ? labels().expandedAnnouncement : labels().collapsedAnnouncement,
      );
      live.announce(message, 'polite', host);
    },
  };
}

/** The shape an override of {@link CNGX_SIDENAV_ANNOUNCER_FACTORY} must match. */
export type CngxSidenavAnnouncerFactory = () => CngxSidenavAnnouncer;

/**
 * Swap token for the hotkey announcement. The default resolves to
 * {@link createSidenavAnnouncer}; the rail builds its announcer via
 * `inject(CNGX_SIDENAV_ANNOUNCER_FACTORY)()` in its own injection context, so
 * an override can still inject `CngxLiveAnnouncer` or the sidenav labels (a
 * telemetry tap, assertive politeness, a silent variant).
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/sidenav/sidenav-announcer.ts
 * @since 0.1.0
 * @relatedTo createSidenavAnnouncer, CngxSidenav
 */
export const CNGX_SIDENAV_ANNOUNCER_FACTORY = new InjectionToken<CngxSidenavAnnouncerFactory>(
  'CngxSidenavAnnouncerFactory',
  { providedIn: 'root', factory: () => createSidenavAnnouncer },
);
