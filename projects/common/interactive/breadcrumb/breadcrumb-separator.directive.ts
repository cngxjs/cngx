import { Directive } from '@angular/core';

/**
 * Visual separator between crumbs (slash, chevron, projected icon). Put
 * `cngxBreadcrumbSeparator` on the separator element; it is marked
 * `aria-hidden="true"` so assistive tech reads the trail as a clean list of
 * links without the decorative glyphs.
 *
 * @category common/interactive/breadcrumb
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/breadcrumb/breadcrumb-separator.directive.ts
 * @since 0.1.0
 * @relatedTo CngxBreadcrumb, CngxBreadcrumbItem
 */
@Directive({
  selector: '[cngxBreadcrumbSeparator]',
  exportAs: 'cngxBreadcrumbSeparator',
  standalone: true,
  host: {
    'aria-hidden': 'true',
  },
})
export class CngxBreadcrumbSeparator {}
