import { computed, Directive, inject, input } from '@angular/core';

import { DEFAULT_OPERATORS } from './filter-builder.types';
import type { FilterExpression } from './filter-builder.types';
import { CNGX_FILTER_BUILDER_HOST } from './filter-builder-host.token';

const BUILTIN_OPERATORS = DEFAULT_OPERATORS as Readonly<Record<string, readonly string[]>>;

/**
 * Context atom binding a `FilterExpression` node at the given path to
 * the recursive template body. Injects the host through
 * `CNGX_FILTER_BUILDER_HOST` (not the concrete presenter class) so the
 * decompose schematic can eject the recursive body independently of the
 * brain per `reference_atomic_decompose` rule 4.
 *
 * `availableOperators` resolves from the field def's own `operators`
 * list when present, else from `DEFAULT_OPERATORS` keyed by the field's
 * `editorType`. Phase 3's `withDefaultOperators` config will replace
 * the builtin lookup at runtime.
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

  readonly node = computed<FilterExpression | null>(() => {
    const found = this.host.getNodeAtPath(this.path());
    if (!found) {
      return null;
    }
    return found.type === 'expression' ? found : null;
  });

  readonly fieldDef = computed(() => {
    const expr = this.node();
    if (!expr) {
      return undefined;
    }
    return this.host.getFieldDef(expr.field);
  });

  readonly availableOperators = computed<readonly string[]>(() => {
    const def = this.fieldDef();
    if (def?.operators && def.operators.length > 0) {
      return def.operators;
    }
    if (!def) {
      return [];
    }
    return BUILTIN_OPERATORS[def.editorType] ?? [];
  });

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
      return 'Unbound filter';
    }
    const def = this.fieldDef();
    const fieldLabel = def?.label ?? expr.field;
    const op = expr.operator || '(no operator)';
    return `Filter: ${fieldLabel} ${op}`;
  });
}
