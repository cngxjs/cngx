import { computed, contentChildren, Directive, inject, input } from '@angular/core';
import { arrayEqual, setEqual } from '@cngx/utils';

import { CngxBreadcrumbItem } from './breadcrumb-item.directive';
import { CNGX_BREADCRUMB_COLLAPSE_STRATEGY } from './breadcrumb-collapse.token';
import { CNGX_BREADCRUMB, type CngxBreadcrumbHost } from './breadcrumb.token';

/**
 * Linear breadcrumb navigation. Put `cngxBreadcrumb` on the `<nav>`; it names
 * the landmark (`aria-label`, EN default "Breadcrumb") and, when the trail
 * exceeds `[maxVisible]`, derives which middle crumbs collapse - keeping the
 * first crumb and the last `maxVisible - 1`. The collapse set is a `computed()`
 * over the projected items, so terminal-crumb marking and overflow are pure
 * derivation, never synced (Pillar 1). Consumers render the collapsed crumbs in
 * an ellipsis `CngxMenu` and may truncate long labels with `CngxTruncate`.
 *
 * ```html
 * <nav cngxBreadcrumb [maxVisible]="4" #bc="cngxBreadcrumb">
 *   <ol>
 *     <li><a cngxBreadcrumbItem href="/">Home</a></li>
 *     <li cngxBreadcrumbSeparator>/</li>
 *     <li><a cngxBreadcrumbItem href="/library">Library</a></li>
 *     <li cngxBreadcrumbSeparator>/</li>
 *     <li><span cngxBreadcrumbItem>Current page</span></li>
 *   </ol>
 * </nav>
 * ```
 *
 * @category common/interactive/breadcrumb
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/breadcrumb/breadcrumb.directive.ts
 * @since 0.1.0
 * @relatedTo CngxBreadcrumbItem, CngxBreadcrumbSeparator, CngxBreadcrumbBar
 */
@Directive({
  selector: '[cngxBreadcrumb]',
  exportAs: 'cngxBreadcrumb',
  standalone: true,
  providers: [{ provide: CNGX_BREADCRUMB, useExisting: CngxBreadcrumb }],
  host: {
    '[attr.aria-label]': 'label()',
  },
})
export class CngxBreadcrumb implements CngxBreadcrumbHost {
  /** Accessible name of the navigation landmark. EN default. */
  readonly label = input<string>('Breadcrumb');
  /** Maximum crumbs to show before the middle collapses. Unset = never collapse. */
  readonly maxVisible = input<number | undefined>(undefined);

  /** Swappable collapse rule; defaults to keep-first + last (max - 1). */
  private readonly collapse = inject(CNGX_BREADCRUMB_COLLAPSE_STRATEGY);

  /** Projected crumbs in DOM order (items may be nested in `<ol>`/`<li>`). */
  private readonly items = contentChildren(CngxBreadcrumbItem, { descendants: true });

  // Item -> index lookup for isTerminal/isCollapsed (O(1), was O(n) indexOf).
  // No `equal`: its sole dependency is items(), so it recomputes only when the
  // item set changes, at which point a fresh WeakMap is the correct downstream
  // signal - a WeakMap keyed by directive instances has no structural equality.
  private readonly indexByItem = computed(() => {
    const map = new WeakMap<CngxBreadcrumbItem, number>();
    this.items().forEach((item, index) => map.set(item, index));
    return map;
  });

  private readonly collapsedIndices = computed<ReadonlySet<number>>(
    () => this.collapse(this.items().length, this.maxVisible() ?? 0),
    { equal: setEqual },
  );

  /** The crumbs currently collapsed into the overflow menu, in order. */
  readonly collapsedItems = computed(
    () => this.items().filter((_, index) => this.collapsedIndices().has(index)),
    { equal: arrayEqual },
  );

  /** Whether any crumb is collapsed (drives the ellipsis trigger's visibility). */
  readonly hasCollapsed = computed(() => this.collapsedIndices().size > 0);

  isTerminal(item: CngxBreadcrumbItem): boolean {
    const index = this.indexByItem().get(item);
    return index !== undefined && index === this.items().length - 1;
  }

  isCollapsed(item: CngxBreadcrumbItem): boolean {
    const index = this.indexByItem().get(item);
    return index !== undefined && this.collapsedIndices().has(index);
  }
}
