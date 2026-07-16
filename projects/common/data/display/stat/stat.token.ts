import { InjectionToken } from '@angular/core';

/** The four coordinated slots of a {@link CngxStat}, in reading order. */
export type CngxStatSlotKind = 'label' | 'value' | 'delta' | 'caption';

/**
 * Slot-registration contract a `CngxStat` exposes to its projected slot
 * directives. Each slot registers its generated id on init and withdraws it
 * on destroy; the molecule derives the combined `aria-labelledby` from the
 * live registration set. Fronted by a DI token (not the concrete `CngxStat`
 * class) so the slots stay decompose-safe - the ejected skin talks to the
 * same token the library defines.
 */
export interface CngxStatRegistry {
  /** Register (or replace) the id contributed by `kind`. */
  register(kind: CngxStatSlotKind, id: string): void;
  /** Withdraw the id contributed by `kind`. */
  unregister(kind: CngxStatSlotKind): void;
}

/** DI token carrying the {@link CngxStatRegistry} a `CngxStat` provides. */
export const CNGX_STAT = new InjectionToken<CngxStatRegistry>('CNGX_STAT');
