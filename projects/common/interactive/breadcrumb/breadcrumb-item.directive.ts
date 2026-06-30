import { computed, Directive, inject } from '@angular/core';

import { CNGX_BREADCRUMB } from './breadcrumb.directive';

/**
 * A single crumb. Put `cngxBreadcrumbItem` on the crumb's `<a>` (or `<span>`
 * for the terminal page). The directive derives `aria-current="page"` for the
 * terminal crumb purely from its position in the trail - no manual flag - and
 * hides itself with `[hidden]` when the coordinator collapses it into the
 * overflow menu.
 *
 * @category common/interactive/breadcrumb
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/breadcrumb/breadcrumb-item.directive.ts
 * @since 0.1.0
 * @relatedTo CngxBreadcrumb, CngxBreadcrumbSeparator
 */
@Directive({
  selector: '[cngxBreadcrumbItem]',
  exportAs: 'cngxBreadcrumbItem',
  standalone: true,
  host: {
    '[attr.aria-current]': "terminal() ? 'page' : null",
    '[hidden]': 'collapsed()',
  },
})
export class CngxBreadcrumbItem {
  private readonly breadcrumb = inject(CNGX_BREADCRUMB);

  /** Whether this is the terminal crumb (the current page). */
  protected readonly terminal = computed(() => this.breadcrumb.isTerminal(this));
  /** Whether this crumb is collapsed into the overflow menu. */
  protected readonly collapsed = computed(() => this.breadcrumb.isCollapsed(this));
}
