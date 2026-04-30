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
 * @example
 * ```html
 * <cngx-tag-group [semanticList]="true" label="Active filters">
 *   <span cngxTag>Frontend</span>
 *   <span cngxTag>Backend</span>
 *   <ng-template cngxTagGroupAccessory let-count="count">
 *     <button (click)="clearAll()">Clear all ({{ count }})</button>
 *   </ng-template>
 * </cngx-tag-group>
 * ```
 *
 * @category display
 */
@Directive({
  selector: 'ng-template[cngxTagGroupAccessory]',
  standalone: true,
  exportAs: 'cngxTagGroupAccessory',
})
export class CngxTagGroupAccessory {
  readonly templateRef = inject<TemplateRef<CngxTagGroupAccessoryContext>>(TemplateRef);
}
