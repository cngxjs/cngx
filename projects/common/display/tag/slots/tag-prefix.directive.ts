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
 * ```html
 * <span cngxTag [color]="'warning'">
 *   <ng-template cngxTagPrefix>
 *     <cngx-icon name="alert-triangle" />
 *   </ng-template>
 *   Action required
 * </span>
 * ```
 * <example-url>http://localhost:4200/tag/app-wide-defaults-via-providetagconfig</example-url>
 * <example-url>http://localhost:4200/tag/color-palette</example-url>
 * <example-url>http://localhost:4200/tag/composition-with-cngxicon</example-url>
 * <example-url>http://localhost:4200/tag/density</example-url>
 * <example-url>http://localhost:4200/tag/group-semantic-list</example-url>
 * <example-url>http://localhost:4200/tag/group-with-header-accessory</example-url>
 * <example-url>http://localhost:4200/tag/layout-only-alignment</example-url>
 * <example-url>http://localhost:4200/tag/layout-only-gap-variants</example-url>
 * <example-url>http://localhost:4200/tag/link-mode</example-url>
 * <example-url>http://localhost:4200/tag/slot-overrides-custom-label</example-url>
 * <example-url>http://localhost:4200/tag/slot-overrides-prefix-label-suffix</example-url>
 * <example-url>http://localhost:4200/tag/truncate-maxwidth</example-url>
 * <example-url>http://localhost:4200/tag/variant-matrix</example-url>
 */
@Directive({
  selector: 'ng-template[cngxTagPrefix]',
  standalone: true,
  exportAs: 'cngxTagPrefix',
})
export class CngxTagPrefix {
  readonly templateRef = inject<TemplateRef<CngxTagPrefixContext>>(TemplateRef);
}
