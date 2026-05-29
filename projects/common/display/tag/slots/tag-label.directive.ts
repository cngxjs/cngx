import { Directive, inject, TemplateRef } from '@angular/core';

import type { CngxTagLabelContext } from './tag-slot.context';

/**
 * Override template for the label region of `<span cngxTag>`.
 *
 * The default label slot wraps projected content in
 * `<span class="cngx-tag__label">` so `text-overflow: ellipsis`
 * has a shrinkable inner with `min-width: 0`. Replace this slot
 * when you need a different inner element (e.g. `<bdi>` for
 * bidi-safe rendering, an inline link, or a richer label
 * composition with icons + counts).
 *
 * Replacing the label drops the default ellipsis hook - the
 * consumer template owns the overflow strategy.
 *
 * ```html
 * <span cngxTag [color]="'success'">
 *   <ng-template cngxTagLabel>
 *     <bdi>{{ user.name }}</bdi>
 *   </ng-template>
 * </span>
 * ```
 *
 * @category common/display
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/display/tag/slots/tag-label.directive.ts
 * @since 0.1.0
 * @relatedTo CngxTag, CngxTagPrefix, CngxTagSuffix
 * <example-url>http://localhost:4200/#/common/display/tag/app-wide-defaults-via-providetagconfig</example-url>
 * <example-url>http://localhost:4200/#/common/display/tag/color-palette</example-url>
 * <example-url>http://localhost:4200/#/common/display/tag/composition-with-cngxicon</example-url>
 * <example-url>http://localhost:4200/#/common/display/tag/density</example-url>
 * <example-url>http://localhost:4200/#/common/display/tag/group-semantic-list</example-url>
 * <example-url>http://localhost:4200/#/common/display/tag/group-with-header-accessory</example-url>
 * <example-url>http://localhost:4200/#/common/display/tag/layout-only-alignment</example-url>
 * <example-url>http://localhost:4200/#/common/display/tag/layout-only-gap-variants</example-url>
 * <example-url>http://localhost:4200/#/common/display/tag/link-mode</example-url>
 * <example-url>http://localhost:4200/#/common/display/tag/slot-overrides-custom-label</example-url>
 * <example-url>http://localhost:4200/#/common/display/tag/slot-overrides-prefix-label-suffix</example-url>
 * <example-url>http://localhost:4200/#/common/display/tag/truncate-maxwidth</example-url>
 * <example-url>http://localhost:4200/#/common/display/tag/variant-matrix</example-url>
 */
@Directive({
  selector: 'ng-template[cngxTagLabel]',
  standalone: true,
  exportAs: 'cngxTagLabel',
})
export class CngxTagLabel {
  readonly templateRef = inject<TemplateRef<CngxTagLabelContext>>(TemplateRef);
}
