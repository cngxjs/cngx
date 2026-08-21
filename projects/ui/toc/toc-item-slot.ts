import { Directive, inject, TemplateRef } from '@angular/core';

import type { CngxTocItemContext } from './toc.types';

/**
 * Per-item template slot for `CngxToc`. Project an `<ng-template cngxTocItem>`
 * inside `<cngx-toc>` to replace the built-in plain-label rendering with
 * custom markup - the `let-` variables come out typed via
 * `ngTemplateContextGuard`:
 *
 * ```html
 * <cngx-toc [items]="toc" contentRoot="#article">
 *   <ng-template cngxTocItem let-item let-active="active" let-depth="depth">
 *     <span [class.is-active]="active">{{ item.label }}</span>
 *     @if (depth === 0) { <cngx-badge>{{ item.children?.length }}</cngx-badge> }
 *   </ng-template>
 * </cngx-toc>
 * ```
 *
 * Named `CngxTocItemSlot` (not `*Directive`) per the repo's no-artifact-suffix
 * rule; the selector stays `cngxTocItem`, which is what consumers write.
 * Resolves ahead of `CNGX_TOC_CONFIG.templates.item` and the built-in label.
 *
 * @category ui/toc
 * @since 0.1.0
 * @relatedTo CngxToc
 * <example-url>http://localhost:4200/#/ui/toc/slots/custom-item-template</example-url>
 */
@Directive({
  selector: 'ng-template[cngxTocItem]',
  standalone: true,
  exportAs: 'cngxTocItem',
})
export class CngxTocItemSlot {
  readonly templateRef = inject<TemplateRef<CngxTocItemContext>>(TemplateRef);

  static ngTemplateContextGuard(
    _dir: CngxTocItemSlot,
    ctx: unknown,
  ): ctx is CngxTocItemContext {
    return true;
  }
}
