import { Directive, inject, input, TemplateRef } from '@angular/core';

import type { EmptyReason } from './card.types';

/**
 * Marker directive placed on `<ng-template>` inside a `<cngx-card-grid>`.
 *
 * The grid selects the template whose `reason` matches the grid's `emptyReason` input.
 * A template without a reason acts as the default fallback.
 *
 * ```html
 * <cngx-card-grid [items]="items()" [emptyReason]="emptyReason()">
 *   <ng-template cngxCardGridEmpty="no-results">
 *     No results found.
 *   </ng-template>
 *   <ng-template cngxCardGridEmpty>
 *     Nothing here yet.
 *   </ng-template>
 * </cngx-card-grid>
 * ```
 *
 * @category card
 */
@Directive({
  selector: '[cngxCardGridEmpty]',
  standalone: true,
})
export class CngxCardGridEmpty {
  /** Empty-state reason this template handles. Omit for a default fallback. */
  readonly reason = input<EmptyReason | '' | undefined>(undefined, {
    alias: 'cngxCardGridEmpty',
  });

  /** @internal Template reference used by `CngxCardGrid` to render the empty state. */
  readonly templateRef = inject(TemplateRef);
}
