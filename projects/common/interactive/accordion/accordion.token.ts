import { InjectionToken, type Signal } from '@angular/core';

import type {
  CngxAccordionHeaderHandle,
  CngxAccordionKeyboardNav,
} from './accordion-keyboard-nav';

/**
 * Contract a {@link CngxAccordion} provides so each {@link CngxAccordionPanel}
 * can read the open/closed arbitration and self-wire keyboard navigation
 * without injecting the concrete parent class (which would create a cyclic
 * type and block Atomic Decompose). The coordinator owns the single open-set
 * signal plus the header registry; panels call {@link toggle}, register their
 * header handle, and bind `tabindex`/`keydown` through {@link nav}.
 *
 * @category common/interactive/accordion
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/accordion/accordion.token.ts
 * @since 0.1.0
 * @relatedTo CngxAccordion, CngxAccordionPanel, createAccordionKeyboardNav
 */
export interface CngxAccordionHost {
  /** Whether more than one panel may stay open at once. */
  readonly multi: Signal<boolean>;
  /** Whether the panel with this id is currently open (reads the open-set signal). */
  isOpen(panelId: string): boolean;
  /** Toggle the panel; in single mode this closes every sibling first. */
  toggle(panelId: string): void;

  /** Every registered header handle (the coordinator's roving registry). */
  readonly headers: Signal<readonly CngxAccordionHeaderHandle[]>;
  /** Id of the header that is the group's single tab stop, or `null`. */
  readonly rovingActiveId: Signal<string | null>;
  /** Resolved keyboard surface panels bind `tabindex` / `keydown` through. */
  readonly nav: CngxAccordionKeyboardNav;
  /** Register a header handle on init (view-boundary-immune, unlike `contentChildren`). */
  registerHeader(handle: CngxAccordionHeaderHandle): void;
  /** Deregister a header handle on destroy. */
  unregisterHeader(handle: CngxAccordionHeaderHandle): void;
  /** Record the header the roving tab stop should move to. */
  setRovingActive(id: string): void;
}

/**
 * DI token for the {@link CngxAccordionHost} contract. {@link CngxAccordion}
 * provides it via `useExisting`; each {@link CngxAccordionPanel} injects it up
 * the element-injector hierarchy.
 *
 * @category common/interactive/accordion
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/accordion/accordion.token.ts
 * @since 0.1.0
 * @relatedTo CngxAccordion, CngxAccordionPanel
 */
export const CNGX_ACCORDION = new InjectionToken<CngxAccordionHost>('CNGX_ACCORDION');
