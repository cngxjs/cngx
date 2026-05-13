import { computed, Directive, inject, input } from '@angular/core';

import type { FilterGroup, FilterNode } from './filter-builder.types';
import { CNGX_FILTER_BUILDER_HOST } from './filter-builder-host.token';
import { referenceEqual } from './filter-builder-internal';

const EMPTY_FILTERS: readonly FilterNode[] = Object.freeze([]) as readonly FilterNode[];

/**
 * Context atom binding a `FilterGroup` node at the given path to the
 * recursive template body. Injects the host through
 * `CNGX_FILTER_BUILDER_HOST` (not the concrete presenter class) so the
 * decompose schematic can eject the recursive body independently of the
 * brain per `reference_atomic_decompose` rule 4.
 *
 * Every object/array signal carries an explicit `equal` fn per
 * `reference_signal_architecture` §1; the empty-filters fallback uses a
 * shared frozen array so null reads do not allocate.
 */
@Directive({
  selector: '[cngxFilterGroup]',
  exportAs: 'cngxFilterGroup',
  standalone: true,
  host: {
    role: 'group',
    '[attr.aria-label]': 'groupLabel()',
    '[class.cngx-filter-group-root]': 'isRoot()',
    '[class.cngx-filter-group-negated]': 'negated()',
  },
})
export class CngxFilterGroup {
  readonly path = input.required<readonly number[]>({ alias: 'cngxFilterGroup' });

  private readonly host = inject(CNGX_FILTER_BUILDER_HOST);

  readonly node = computed<FilterGroup | null>(
    () => {
      const found = this.host.getNodeAtPath(this.path());
      if (!found) {
        return null;
      }
      return found.type === 'group' ? found : null;
    },
    { equal: referenceEqual },
  );

  readonly logic = computed(() => this.node()?.logic ?? 'and');
  readonly negated = computed(() => this.node()?.negated ?? false);
  readonly children = computed<readonly FilterNode[]>(
    () => this.node()?.filters ?? EMPTY_FILTERS,
    { equal: referenceEqual },
  );
  readonly childCount = computed(() => this.children().length);
  readonly isRoot = computed(() => this.path().length === 0);

  readonly groupLabel = computed(() => {
    const logic = this.logic().toUpperCase();
    const negated = this.negated() ? ', negated' : '';
    const heading = this.isRoot() ? 'Root filter group' : 'Filter group';
    return `${heading} (${logic}${negated})`;
  });
}
