import { Directive, inject, TemplateRef } from '@angular/core';

import type { CngxTagGroupHeaderContext } from './tag-group-slot.context';

/**
 * Override template for the header zone of `<cngx-tag-group>` —
 * projected ABOVE the row of tags. Use for label-prefix
 * ("Filters"), count badges, sort toggles that span the group, or
 * any header decoration the consumer wants to bundle with the
 * layout.
 *
 * The slot has no default body — when not projected, no DOM is
 * rendered above the tag row. The reactive count of projected
 * `<span cngxTag>` siblings is exposed via the slot context for
 * consumer "Filters ({{ count }})" patterns without injection.
 *
 * ```html
 * <cngx-tag-group [semanticList]="true" label="Filters">
 *   <ng-template cngxTagGroupHeader let-count="count">
 *     <strong>Filters ({{ count }})</strong>
 *   </ng-template>
 *   <span cngxTag>Frontend</span>
 *   <span cngxTag>Backend</span>
 * </cngx-tag-group>
 * ```
 * <example-url>http://localhost:4200/common/display/tag/app-wide-defaults-via-providetagconfig</example-url>
 * <example-url>http://localhost:4200/common/display/tag/color-palette</example-url>
 * <example-url>http://localhost:4200/common/display/tag/composition-with-cngxicon</example-url>
 * <example-url>http://localhost:4200/common/display/tag/density</example-url>
 * <example-url>http://localhost:4200/common/display/tag/group-semantic-list</example-url>
 * <example-url>http://localhost:4200/common/display/tag/group-with-header-accessory</example-url>
 * <example-url>http://localhost:4200/common/display/tag/layout-only-alignment</example-url>
 * <example-url>http://localhost:4200/common/display/tag/layout-only-gap-variants</example-url>
 * <example-url>http://localhost:4200/common/display/tag/link-mode</example-url>
 * <example-url>http://localhost:4200/common/display/tag/slot-overrides-custom-label</example-url>
 * <example-url>http://localhost:4200/common/display/tag/slot-overrides-prefix-label-suffix</example-url>
 * <example-url>http://localhost:4200/common/display/tag/truncate-maxwidth</example-url>
 * <example-url>http://localhost:4200/common/display/tag/variant-matrix</example-url>
 */
@Directive({
  selector: 'ng-template[cngxTagGroupHeader]',
  standalone: true,
  exportAs: 'cngxTagGroupHeader',
})
export class CngxTagGroupHeader {
  readonly templateRef = inject<TemplateRef<CngxTagGroupHeaderContext>>(TemplateRef);
}
