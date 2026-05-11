import { Directive, inject, TemplateRef } from '@angular/core';

import type { CngxTagPrefixContext } from './tag-slot.context';

/**
 * Override template for content rendered BEFORE the label region of
 * `<span cngxTag>`. Use for icon glyphs, status dots, count badges,
 * or any per-tag prefix decoration.
 *
 * The slot has no default body — when not projected, no DOM is
 * rendered in the prefix position.
 *
 * @example
 * ```html
 * <span cngxTag [color]="'warning'">
 *   <ng-template cngxTagPrefix>
 *     <cngx-icon name="alert-triangle" />
 *   </ng-template>
 *   Action required
 * </span>
 * ```
 *
 * @category display
 */
@Directive({
  selector: 'ng-template[cngxTagPrefix]',
  standalone: true,
  exportAs: 'cngxTagPrefix',
})
export class CngxTagPrefix {
  readonly templateRef = inject<TemplateRef<CngxTagPrefixContext>>(TemplateRef);
}
