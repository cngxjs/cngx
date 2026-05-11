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
 * Replacing the label drops the default ellipsis hook — the
 * consumer template owns the overflow strategy.
 *
 * @example
 * ```html
 * <span cngxTag [color]="'success'">
 *   <ng-template cngxTagLabel>
 *     <bdi>{{ user.name }}</bdi>
 *   </ng-template>
 * </span>
 * ```
 *
 * @category display
 */
@Directive({
  selector: 'ng-template[cngxTagLabel]',
  standalone: true,
  exportAs: 'cngxTagLabel',
})
export class CngxTagLabel {
  readonly templateRef = inject<TemplateRef<CngxTagLabelContext>>(TemplateRef);
}
