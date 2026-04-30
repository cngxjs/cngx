import { Directive, inject, TemplateRef } from '@angular/core';

import type { CngxTagSuffixContext } from './tag-slot.context';

/**
 * Override template for content rendered AFTER the label region of
 * `<span cngxTag>`. Use for trailing chevrons, sort indicators, or
 * any per-tag suffix decoration.
 *
 * The slot has no default body — when not projected, no DOM is
 * rendered in the suffix position. Removable affordances belong on
 * `CngxChip` (which ships its own remove button + announcer
 * wiring), not as a Tag suffix slot.
 *
 * @example
 * ```html
 * <span cngxTag [color]="'info'">
 *   Filter
 *   <ng-template cngxTagSuffix>
 *     <cngx-icon name="chevron-down" />
 *   </ng-template>
 * </span>
 * ```
 *
 * @category display
 */
@Directive({
  selector: 'ng-template[cngxTagSuffix]',
  standalone: true,
  exportAs: 'cngxTagSuffix',
})
export class CngxTagSuffix {
  readonly templateRef = inject<TemplateRef<CngxTagSuffixContext>>(TemplateRef);
}
