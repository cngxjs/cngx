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
 * ```html
 * <span cngxTag [color]="'info'">
 *   Filter
 *   <ng-template cngxTagSuffix>
 *     <cngx-icon name="chevron-down" />
 *   </ng-template>
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
  selector: 'ng-template[cngxTagSuffix]',
  standalone: true,
  exportAs: 'cngxTagSuffix',
})
export class CngxTagSuffix {
  readonly templateRef = inject<TemplateRef<CngxTagSuffixContext>>(TemplateRef);
}
