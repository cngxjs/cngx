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
 * @example
 * ```html
 * <cngx-tag-group [semanticList]="true" label="Filters">
 *   <ng-template cngxTagGroupHeader let-count="count">
 *     <strong>Filters ({{ count }})</strong>
 *   </ng-template>
 *   <span cngxTag>Frontend</span>
 *   <span cngxTag>Backend</span>
 * </cngx-tag-group>
 * ```
 *
 * @category display
 */
@Directive({
  selector: 'ng-template[cngxTagGroupHeader]',
  standalone: true,
  exportAs: 'cngxTagGroupHeader',
})
export class CngxTagGroupHeader {
  readonly templateRef = inject<TemplateRef<CngxTagGroupHeaderContext>>(TemplateRef);
}
