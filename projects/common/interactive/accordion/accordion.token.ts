import { InjectionToken, type Signal } from '@angular/core';

/**
 * Contract a {@link CngxAccordion} provides so each {@link CngxAccordionPanel}
 * can read the open/closed arbitration without injecting the concrete parent
 * class (which would create a cyclic type and block Atomic Decompose). The
 * coordinator owns the single open-set signal; panels only call {@link toggle}
 * and derive their `aria-expanded` from {@link isOpen}.
 *
 * @category common/interactive/accordion
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/accordion/accordion.token.ts
 * @since 0.1.0
 * @relatedTo CngxAccordion, CngxAccordionPanel
 */
export interface CngxAccordionHost {
  /** Whether more than one panel may stay open at once. */
  readonly multi: Signal<boolean>;
  /** Whether the panel with this id is currently open (reads the open-set signal). */
  isOpen(panelId: string): boolean;
  /** Toggle the panel; in single mode this closes every sibling first. */
  toggle(panelId: string): void;
  /** Announce a panel to the coordinator (membership tracking). */
  registerPanel(panelId: string): void;
  /** Withdraw a panel from the coordinator on destroy. */
  unregisterPanel(panelId: string): void;
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
