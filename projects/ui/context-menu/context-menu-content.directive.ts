import { Directive, inject, TemplateRef } from '@angular/core';

/**
 * Context handed to a `*cngxContextMenuContent` template. `$implicit` is the
 * per-open datum the trigger resolved for the target the menu opened over
 * (`null` while the menu is closed). Read it with `let-row`.
 *
 * @category ui/context-menu
 */
export interface CngxContextMenuContentContext<T = unknown> {
  /** The per-open datum, or `null` while the menu is closed. Usable as `let-row`. */
  readonly $implicit: T | null;
}

/**
 * Lazy content slot for {@link CngxContextMenu}. The template renders only
 * while the menu is open and receives the trigger's per-open datum as
 * `$implicit`, so one panel declaration serves every target of a delegated
 * trigger with row-correct content.
 *
 * ```html
 * <cngx-context-menu #menu ariaLabel="Row actions">
 *   <ng-template cngxContextMenuContent let-row>
 *     <cngx-context-menu-item (select)="edit(row)">Edit {{ row.name }}</cngx-context-menu-item>
 *   </ng-template>
 * </cngx-context-menu>
 * ```
 *
 * @category ui/context-menu
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/context-menu/context-menu-content.directive.ts
 * @since 0.1.0
 * @relatedTo CngxContextMenu, CngxContextMenuFor
 */
@Directive({
  selector: 'ng-template[cngxContextMenuContent]',
  exportAs: 'cngxContextMenuContent',
  standalone: true,
})
export class CngxContextMenuContent<T = unknown> {
  /** The projected `<ng-template>`, rendered by the panel while open. */
  readonly templateRef = inject<TemplateRef<CngxContextMenuContentContext<T>>>(TemplateRef);

  /** Narrows `let-` bindings to {@link CngxContextMenuContentContext} under strict templates. */
  static ngTemplateContextGuard<T>(
    _dir: CngxContextMenuContent<T>,
    _ctx: unknown,
  ): _ctx is CngxContextMenuContentContext<T> {
    return true;
  }
}
