import { Directive } from '@angular/core';

/**
 * Marks the inline visualisation of a {@link CngxStatCard} - a `cngx-sparkline`,
 * `cngx-mini-area`, `cngx-deviation-bar`, or any other compact chart preset.
 *
 * Rendered beside the stat block and outside its `aria-labelledby` chain: the
 * accessible name stays the numbers a screen reader can actually read, while
 * the viz stays decorative unless the projected preset carries its own
 * accessible name.
 *
 * @category ui/stat-card
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/stat-card/stat-card-slots.ts
 * @since 0.1.0
 * @relatedTo CngxStatCard, CngxStatCardFooter
 */
@Directive({
  selector: '[cngxStatCardViz]',
  standalone: true,
  host: { class: 'cngx-stat-card__viz' },
})
export class CngxStatCardViz {}

/**
 * Marks the footer row of a {@link CngxStatCard} - a timestamp, a drill-down
 * link, a `cngx-tag` row. Rendered below the stat block and the viz slot.
 *
 * @category ui/stat-card
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/stat-card/stat-card-slots.ts
 * @since 0.1.0
 * @relatedTo CngxStatCard, CngxStatCardViz
 */
@Directive({
  selector: '[cngxStatCardFooter]',
  standalone: true,
  host: { class: 'cngx-stat-card__footer' },
})
export class CngxStatCardFooter {}
