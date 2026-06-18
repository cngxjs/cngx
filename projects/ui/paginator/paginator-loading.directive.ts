import { Directive, inject, TemplateRef } from '@angular/core';

/**
 * Overrides the paginator's built-in busy indicator. Project a structural
 * `*cngxPaginatorLoading` template inside `<cngx-paginator>` and the shell
 * renders it - instead of the default `<cngx-progress>` bar - while the bound
 * async state is busy. Resolution cascades instance slot ->
 * `CngxPaginatorConfig.templates.loading` -> built-in `CngxProgress`.
 *
 * ```html
 * <cngx-paginator [state]="state">
 *   <ng-template cngxPaginatorLoading>
 *     <my-branded-spinner />
 *   </ng-template>
 *   <cngx-pgn-pages />
 * </cngx-paginator>
 * ```
 *
 * @category ui/paginator
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/paginator/paginator-loading.directive.ts
 * @since 0.1.0
 * @relatedTo CngxPaginator, CngxProgress
 */
@Directive({ selector: '[cngxPaginatorLoading]', standalone: true, exportAs: 'cngxPaginatorLoading' })
export class CngxPaginatorLoading {
  readonly templateRef = inject(TemplateRef);
}
