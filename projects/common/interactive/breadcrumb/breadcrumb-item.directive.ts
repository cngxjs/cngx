import { computed, Directive, ElementRef, inject, input } from '@angular/core';

import { CNGX_BREADCRUMB } from './breadcrumb.token';

/**
 * A single crumb. Put `cngxBreadcrumbItem` on the crumb element. Intermediate
 * crumbs are links (`<a href>`); the terminal crumb may be either a `<span>` or
 * an `<a [attr.href]="null">` - both derive `aria-current="page"` purely from
 * position in the trail (no manual flag). The item hides itself with `[hidden]`
 * when the coordinator collapses it into the overflow menu.
 *
 * @category common/interactive/breadcrumb
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/breadcrumb/breadcrumb-item.directive.ts
 * @since 0.1.0
 * @relatedTo CngxBreadcrumb, CngxBreadcrumbSeparator
 * <example-url>http://localhost:4200/#/common/interactive/breadcrumb/basic-trail</example-url>
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
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /**
   * Explicit accessible label for the overflow menu, when the crumb's rendered
   * text is not the right string to list (e.g. an icon-only crumb). Reactive:
   * bind it when the crumb text is dynamic.
   */
  readonly label = input<string>('', { alias: 'cngxBreadcrumbItemLabel' });

  /** Whether this is the terminal crumb (the current page). */
  protected readonly terminal = computed(() => this.breadcrumb.isTerminal(this));
  /** Whether this crumb is collapsed into the overflow menu. */
  protected readonly collapsed = computed(() => this.breadcrumb.isCollapsed(this));

  /**
   * Readable label for the collapsed-crumb list. Prefers the explicit
   * {@link label} input; otherwise falls back to the projected text.
   *
   * The fallback is a **one-shot DOM read at call time**, not reactive - it
   * reflects the text present when called. For crumbs whose text changes at
   * runtime, bind `[cngxBreadcrumbItemLabel]` so the reactive path is used.
   */
  resolvedLabel(): string {
    const explicit = this.label();
    if (explicit) {
      return explicit;
    }
    return this.host.nativeElement.textContent?.trim() ?? '';
  }
}
