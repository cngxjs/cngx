import { Directive, inject, TemplateRef } from '@angular/core';

import type { CngxTagGroupAccessoryContext } from './tag-group-slot.context';

/**
 * Override template for the accessory zone of `<cngx-tag-group>` —
 * projected BELOW the row of tags. Use for clear-all buttons,
 * sort toggles that span the group, secondary actions, or any
 * trailing decoration the consumer wants to bundle with the
 * layout.
 *
 * The slot has no default body — when not projected, no DOM is
 * rendered below the tag row. The reactive count of projected
 * `<span cngxTag>` siblings is exposed via the slot context so
 * consumer "Clear all (5)" patterns work without injection.
 *
 * ```html
 * <cngx-tag-group [semanticList]="true" label="Active filters">
 *   <span cngxTag>Frontend</span>
 *   <span cngxTag>Backend</span>
 *   <ng-template cngxTagGroupAccessory let-count="count">
 *     <button (click)="clearAll()">Clear all ({{ count }})</button>
 *   </ng-template>
 * </cngx-tag-group>
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
  selector: 'ng-template[cngxTagGroupAccessory]',
  standalone: true,
  exportAs: 'cngxTagGroupAccessory',
})
export class CngxTagGroupAccessory {
  readonly templateRef = inject<TemplateRef<CngxTagGroupAccessoryContext>>(TemplateRef);
}
