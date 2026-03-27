import { Directive, input } from '@angular/core';

/**
 * Adds a color-coded severity accent to a card.
 *
 * Renders as a colored top border + tinted background to communicate
 * status visually. Differentiates by both color and border width
 * (not just color — WCAG 1.4.1).
 *
 * ```html
 * <cngx-card cngxCardAccent="warning">
 *   <header cngxCardHeader>
 *     <h3 cngxCardTitle>Blutzucker</h3>
 *   </header>
 * </cngx-card>
 * ```
 *
 * @category card
 */
@Directive({
  selector: '[cngxCardAccent]',
  standalone: true,
  host: {
    '[class.cngx-card--accent]': 'true',
    '[class.cngx-card--accent-info]': 'severity() === "info"',
    '[class.cngx-card--accent-success]': 'severity() === "success"',
    '[class.cngx-card--accent-warning]': 'severity() === "warning"',
    '[class.cngx-card--accent-danger]': 'severity() === "danger"',
    '[class.cngx-card--accent-neutral]': 'severity() === "neutral"',
  },
})
export class CngxCardAccent {
  /** Severity level controlling the accent color. */
  readonly severity = input<'info' | 'success' | 'warning' | 'danger' | 'neutral'>(
    'neutral',
    { alias: 'cngxCardAccent' },
  );
}
