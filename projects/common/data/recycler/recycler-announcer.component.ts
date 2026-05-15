// Phase 4: recycler-announcer.component.ts — CngxRecyclerAnnouncer convenience

import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import type { CngxRecycler } from './recycler';

/**
 * Convenience component that renders the `aria-live="polite"` region
 * for recycler SR announcements. Eliminates manual boilerplate.
 *
 * Uses `display: contents` — no layout impact.
 *
 * ```html
 * <cngx-recycler-announcer [cngxRecyclerAnnouncer]="recycler" />
 * ```
 * <example-url>http://localhost:4200/recycler/basic-list-fixed-item-height</example-url>
 * <example-url>http://localhost:4200/recycler/content-visibility-css-only</example-url>
 * <example-url>http://localhost:4200/recycler/infinite-scroll-recycler</example-url>
 * <example-url>http://localhost:4200/recycler/scrolltoindex-deep-link</example-url>
 * <example-url>http://localhost:4200/recycler/variable-heights-cngxmeasure</example-url>
 * <example-url>http://localhost:4200/recycler/with-cngxasyncstate-skeleton-first-load</example-url>
 */
@Component({
  selector: 'cngx-recycler-announcer',
  standalone: true,
  template: `<span aria-live="polite" aria-atomic="true" class="cngx-sr-only">{{
    recycler().announcement()
  }}</span>`,
  host: { style: 'display: contents' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CngxRecyclerAnnouncer {
  /** The recycler instance providing `announcement()`. */
  readonly recycler = input.required<CngxRecycler>({ alias: 'cngxRecyclerAnnouncer' });
}
