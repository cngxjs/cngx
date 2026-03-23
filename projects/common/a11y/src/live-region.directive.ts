import { Directive, input } from '@angular/core';

/**
 * Configures the host element as an ARIA live region.
 *
 * Screen readers monitor live regions and announce content changes automatically.
 * `polite` announcements are queued after the current utterance finishes;
 * `assertive` announcements interrupt immediately. `off` disables announcements.
 *
 * Sets `role="alert"` for assertive regions and `role="status"` for polite regions
 * via a host binding — no manual attribute wiring needed.
 *
 * Unlike CDK's `LiveAnnouncer` service (which creates a hidden DOM element and
 * requires imperative `announce()` calls), this directive decorates your own
 * element declaratively — the content you render IS the announcement.
 *
 * @usageNotes
 *
 * ### Status message
 * ```html
 * <div cngxLiveRegion [politeness]="'polite'">
 *   {{ statusMessage() }}
 * </div>
 * ```
 *
 * ### Form validation error (assertive)
 * ```html
 * <div cngxLiveRegion [politeness]="'assertive'"
 *      [style.color]="error() ? 'red' : 'transparent'">
 *   {{ error() }}
 * </div>
 * ```
 */
@Directive({
  selector: '[cngxLiveRegion]',
  exportAs: 'cngxLiveRegion',
  standalone: true,
  host: {
    '[attr.aria-live]': 'politeness()',
    '[attr.aria-atomic]': 'atomic()',
    '[attr.aria-relevant]': 'relevant()',
    '[attr.role]': "politeness() === 'assertive' ? 'alert' : 'status'",
  },
})
export class CngxLiveRegion {
  /**
   * Controls the urgency of announcements.
   * - `'polite'` — queued after current speech (default)
   * - `'assertive'` — interrupts immediately
   * - `'off'` — no announcements
   */
  readonly politeness = input<'polite' | 'assertive' | 'off'>('polite');
  /** Whether the entire region should be announced as a whole. */
  readonly atomic = input<boolean>(true);
  /** Which types of content changes to announce. Space-separated: `additions`, `removals`, `text`. */
  readonly relevant = input<string>('additions text');
}
