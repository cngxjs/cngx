import { computed, contentChildren, Directive, InjectionToken, input } from '@angular/core';
import { arrayEqual, setEqual } from '@cngx/utils';

// Value import (used by the `contentChildren` query). The breadcrumb <-> item
// modules form a cycle, but the class and token are only touched at runtime
// (query init / inject), never at module-eval, so the live bindings resolve.
import { CngxBreadcrumbItem } from './breadcrumb-item.directive';

/** Contract a {@link CngxBreadcrumb} provides to its items via DI. */
export interface CngxBreadcrumbHost {
  /** Whether this item is the terminal crumb (gets `aria-current="page"`). */
  isTerminal(item: CngxBreadcrumbItem): boolean;
  /** Whether this item is collapsed into the overflow menu (hidden in the trail). */
  isCollapsed(item: CngxBreadcrumbItem): boolean;
}

/**
 * DI token for the {@link CngxBreadcrumbHost} contract. {@link CngxBreadcrumb}
 * provides it via `useExisting`; each {@link CngxBreadcrumbItem} injects it.
 *
 * @category common/interactive/breadcrumb
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/breadcrumb/breadcrumb.directive.ts
 * @since 0.1.0
 * @relatedTo CngxBreadcrumb, CngxBreadcrumbItem
 */
export const CNGX_BREADCRUMB = new InjectionToken<CngxBreadcrumbHost>('CNGX_BREADCRUMB');

const NO_COLLAPSE: ReadonlySet<number> = new Set();

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
 * @relatedTo CngxBreadcrumbItem, CngxBreadcrumbSeparator, CngxMenu, CngxTruncate
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

  /** Projected crumbs in DOM order (items may be nested in `<ol>`/`<li>`). */
  private readonly items = contentChildren(CngxBreadcrumbItem, { descendants: true });

  private readonly collapsedIndices = computed<ReadonlySet<number>>(
    () => {
      const max = this.maxVisible();
      const total = this.items().length;
      if (!max || max < 1 || total <= max) {
        return NO_COLLAPSE;
      }
      // Keep the first crumb and the last (max - 1); collapse the middle.
      const keepTail = max - 1;
      const collapsed = new Set<number>();
      for (let i = 1; i < total - keepTail; i++) {
        collapsed.add(i);
      }
      return collapsed;
    },
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
    const list = this.items();
    return list.length > 0 && list.at(-1) === item;
  }

  isCollapsed(item: CngxBreadcrumbItem): boolean {
    const index = this.items().indexOf(item);
    return index >= 0 && this.collapsedIndices().has(index);
  }
}
