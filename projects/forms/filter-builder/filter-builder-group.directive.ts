import { computed, Directive, inject, input } from '@angular/core';

import type { FilterGroup, FilterNode } from './filter-builder.types';
import { injectFilterBuilderConfig } from './filter-builder.config';
import { CNGX_FILTER_BUILDER_HOST } from './filter-builder-host.token';
import { referenceEqual } from './filter-builder-internal';

/** @internal */
const EMPTY_FILTERS: readonly FilterNode[] = Object.freeze([]) as readonly FilterNode[];

/**
 * Context atom binding a `FilterGroup` node at the given path to the
 * recursive template body. Injects the host through
 * `CNGX_FILTER_BUILDER_HOST` (not the concrete presenter class) so the
 * decompose schematic can eject the recursive body independently of the
 * brain.
 *
 * Every object/array signal carries an explicit `equal` fn; the
 * empty-filters fallback uses a shared frozen array so null reads do not
 * allocate.
 *
 * @category forms/filter-builder
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/filter-builder/filter-builder-group.directive.ts
 * @since 0.1.0
 * @relatedTo CngxFilterExpression, CngxFilterBuilderPresenter, CngxFilterBuilder
 * <example-url>http://localhost:4200/#/forms/filter-builder/basic-two-way-binding-json-inspection</example-url>
 * <example-url>http://localhost:4200/#/forms/filter-builder/seeded-tree-and-or-composition</example-url>
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
    '[style.--cngx-filter-builder-depth]': 'depth()',
  },
})
export class CngxFilterGroup {
  readonly path = input.required<readonly number[]>({ alias: 'cngxFilterGroup' });

  private readonly host = inject(CNGX_FILTER_BUILDER_HOST);
  private readonly config = injectFilterBuilderConfig();

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
  readonly depth = computed(() => this.path().length);

  readonly groupLabel = computed(() =>
    this.config.i18n.groupLabel({
      logic: this.logic(),
      negated: this.negated(),
      isRoot: this.isRoot(),
    }),
  );
}
