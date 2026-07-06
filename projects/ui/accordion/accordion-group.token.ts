import { InjectionToken, type Signal } from '@angular/core';

/**
 * UI-local context a {@link CngxAccordionGroup} exposes so each
 * `CngxAccordionItem` reads the shared heading level without injecting the
 * concrete group class (cyclic type, blocks Atomic Decompose). Kept separate
 * from the headless `CNGX_ACCORDION` brain contract, which stays
 * skin-agnostic - heading semantics are a skin concern.
 *
 * @category ui/accordion
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/accordion/accordion-group.token.ts
 * @since 0.1.0
 * @relatedTo CngxAccordionGroup, CngxAccordionItem
 */
export interface CngxAccordionGroupContext {
  /** Heading level (2-6) every item's `role="heading"` wrapper reflects via `aria-level`. */
  readonly headingLevel: Signal<number>;
}

/**
 * DI token for the {@link CngxAccordionGroupContext}. {@link CngxAccordionGroup}
 * provides it via `useExisting`; each `CngxAccordionItem` injects it.
 *
 * @category ui/accordion
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/accordion/accordion-group.token.ts
 * @since 0.1.0
 * @relatedTo CngxAccordionGroup, CngxAccordionItem
 */
export const CNGX_ACCORDION_GROUP = new InjectionToken<CngxAccordionGroupContext>(
  'CNGX_ACCORDION_GROUP',
);
