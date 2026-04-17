import { Directive, input } from '@angular/core';

/**
 * Groups related `CngxOption`s under a visual and semantic header.
 *
 * Renders `role="group"` and `aria-label` — children stay flat in the AD item
 * list; grouping is purely presentational and for ATs that render group labels.
 *
 * @category interactive
 */
@Directive({
  selector: '[cngxOptionGroup]',
  exportAs: 'cngxOptionGroup',
  standalone: true,
  host: {
    role: 'group',
    '[attr.aria-label]': 'label()',
  },
})
export class CngxOptionGroup {
  /** Accessible group label. */
  readonly label = input.required<string>();
}
