import { computed, Directive, inject, input } from '@angular/core';

import type { FilterExpression } from './filter-builder.types';
import { injectFilterBuilderConfig } from './filter-builder.config';
import { CNGX_FILTER_BUILDER_HOST } from './filter-builder-host.token';
import { referenceEqual } from './filter-builder-internal';

/** @internal */
const EMPTY_OPERATORS: readonly string[] = Object.freeze([]) as readonly string[];

/**
 * Context atom binding a `FilterExpression` node at the given path to
 * the recursive template body. Injects the host through
 * `CNGX_FILTER_BUILDER_HOST` (not the concrete presenter class) so the
 * decompose schematic can eject the recursive body independently of the
 * brain per `reference_atomic_decompose` rule 4.
 *
 * `availableOperators` resolves from the field def's own `operators`
 * list when present, else from `CNGX_FILTER_BUILDER_CONFIG.defaultOperators`
 * keyed by the field's `editorType` - consumers swap defaults at app or
 * view scope via `withDefaultOperators({...})`.
 *
 * Every object/array signal carries an explicit `equal` fn per
 * `reference_signal_architecture` §1; empty-operator and missing-node
 * fallbacks resolve to shared frozen singletons so no-op reads never
 * allocate.
 *
 * @category forms/filter-builder
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/filter-builder/filter-builder-expression.directive.ts
 * @since 0.1.0
 * @relatedTo CngxFilterGroup, CngxFilterBuilderPresenter, CngxFilterBuilder
 * <example-url>http://localhost:4200/#/forms/filter-builder/basic-two-way-binding-json-inspection</example-url>
 * <example-url>http://localhost:4200/#/forms/filter-builder/seeded-tree-and-or-composition</example-url>
 */
@Directive({
  selector: '[cngxFilterExpression]',
  exportAs: 'cngxFilterExpression',
  standalone: true,
  host: {
    role: 'group',
    '[attr.aria-label]': 'expressionLabel()',
    '[class.cngx-filter-expression-incomplete]': 'isIncomplete()',
  },
})
export class CngxFilterExpression {
  readonly path = input.required<readonly number[]>({ alias: 'cngxFilterExpression' });

  private readonly host = inject(CNGX_FILTER_BUILDER_HOST);
  private readonly config = injectFilterBuilderConfig();

  readonly node = computed<FilterExpression | null>(
    () => {
      const found = this.host.getNodeAtPath(this.path());
      if (!found) {
        return null;
      }
      return found.type === 'expression' ? found : null;
    },
    { equal: referenceEqual },
  );

  readonly fieldDef = computed(
    () => {
      const expr = this.node();
      if (!expr) {
        return undefined;
      }
      return this.host.getFieldDef(expr.field);
    },
    { equal: referenceEqual },
  );

  readonly availableOperators = computed<readonly string[]>(
    () => {
      const def = this.fieldDef();
      if (def?.operators && def.operators.length > 0) {
        return def.operators;
      }
      if (!def) {
        return EMPTY_OPERATORS;
      }
      return this.config.defaultOperators[def.editorType] ?? EMPTY_OPERATORS;
    },
    { equal: referenceEqual },
  );

  readonly isIncomplete = computed(() => {
    const expr = this.node();
    if (!expr) {
      return true;
    }
    return !expr.field || !expr.operator;
  });

  readonly expressionLabel = computed(() => {
    const expr = this.node();
    if (!expr) {
      return this.config.i18n.unboundFilterLabel;
    }
    const def = this.fieldDef();
    const fieldLabel = def?.label ?? expr.field;
    return this.config.i18n.expressionLabel({
      fieldLabel,
      operator: expr.operator,
    });
  });
}
