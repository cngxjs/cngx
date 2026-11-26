import { Directive, input } from '@angular/core';

/** Severity a {@link CngxCardAccent} paints. `neutral` means no status. */
export type CngxCardAccentSeverity = 'info' | 'success' | 'warning' | 'danger' | 'neutral';

/**
 * Marks a card with a severity, for dashboards where one tile has to stand
 * out among many.
 *
 * Paints the feedback family's severity recipe (alert, banner, toast): a
 * pale tint and a pastel border. `neutral` (the default) is no status and
 * paints a plain card. Colour alone carries no meaning (WCAG 1.4.1): put a
 * {@link CngxCardAccentIcon} in the title for a shape + text cue, or let the
 * card content say it.
 *
 * ```html
 * <cngx-card cngxCardAccent="warning">
 *   <header cngxCardHeader>
 *     <h3 cngxCardTitle><cngx-card-accent-icon />Blutzucker</h3>
 *   </header>
 * </cngx-card>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/card/card-accent.directive.ts
 * @since 0.3.0
 * @relatedTo CngxCard, CngxCardAccentIcon, CngxCardBadge, CngxCardHeader
 * <example-url>/#/common/card/severity-accent</example-url>
 * @axis level organism
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
  /** Severity level controlling the accent colour. */
  readonly severity = input<CngxCardAccentSeverity>('neutral', {
    alias: 'cngxCardAccent',
  });
}
