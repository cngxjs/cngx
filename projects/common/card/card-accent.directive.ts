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
 * <example-url>http://localhost:4200/card/action-card-with-selection</example-url>
 * <example-url>http://localhost:4200/card/card-with-badge</example-url>
 * <example-url>http://localhost:4200/card/card-with-disclosure-expand-collapse</example-url>
 * <example-url>http://localhost:4200/card/card-with-expandable-text</example-url>
 * <example-url>http://localhost:4200/card/card-with-image</example-url>
 * <example-url>http://localhost:4200/card/card-with-speak-badge</example-url>
 * <example-url>http://localhost:4200/card/disabled-with-reason</example-url>
 * <example-url>http://localhost:4200/card/interactive-card-with-actions</example-url>
 * <example-url>http://localhost:4200/card/loading-state</example-url>
 * <example-url>http://localhost:4200/card/severity-accent</example-url>
 * <example-url>http://localhost:4200/card/skeleton-loading</example-url>
 * <example-url>http://localhost:4200/card/title-subtitle-footer</example-url>
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
  readonly severity = input<'info' | 'success' | 'warning' | 'danger' | 'neutral'>('neutral', {
    alias: 'cngxCardAccent',
  });
}
