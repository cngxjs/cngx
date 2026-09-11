import { computed, InjectionToken, type Signal, type TemplateRef } from '@angular/core';
import { arrayEqual } from '@cngx/utils';

import { isExpressionValueEmpty } from './filter-builder-internal';
import { resolveOperatorDef } from './filter-builder-operators';
import type { CngxFilterBuilderRemoveButtonContext } from './filter-builder-slots';
import type { CngxFilterBuilderTemplateRegistry } from './filter-builder-template-registry';
import type { CngxFilterBuilderValueEditorContext } from './filter-builder-value-editor.slot';
import type { CngxFilterBuilderConfig, CngxFilterEditor } from './filter-builder.config';
import type { FilterExpression, FilterFieldDef } from './filter-builder.types';

/** @internal */
const EMPTY_OPERATORS: readonly string[] = Object.freeze([]) as readonly string[];

/** @internal */
function equalOptionList<T>(
  a: readonly { value: T; label: string }[],
  b: readonly { value: T; label: string }[],
): boolean {
  if (a === b) {
    return true;
  }
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    const aa = a[i];
    const bb = b[i];
    if (aa.value !== bb.value || aa.label !== bb.label) {
      return false;
    }
  }
  return true;
}

/** @internal */
function equalFieldMap(
  a: ReadonlyMap<string, FilterFieldDef>,
  b: ReadonlyMap<string, FilterFieldDef>,
): boolean {
  if (a === b) {
    return true;
  }
  if (a.size !== b.size) {
    return false;
  }
  for (const [key, value] of a) {
    if (b.get(key) !== value) {
      return false;
    }
  }
  return true;
}

/**
 * Option entry the row's field / operator `<cngx-select>` pickers consume.
 *
 * @category forms/filter-builder/config
 */
export interface CngxFilterRowOption {
  readonly value: string;
  readonly label: string;
}

/**
 * Result of a field change computed by the controller: the new field key,
 * the operator the expression should carry afterwards, and whether the
 * value must be cleared because the carried operator is invalid for the
 * new field's operator list. The carry-over policy is fixed - keep
 * operator and value when the operator is still valid for the new field,
 * else fall back to the field's default operator and clear the value -
 * and each write sink applies the plan against its own storage.
 *
 * @category forms/filter-builder/config
 */
export interface CngxFilterRowFieldChangePlan {
  readonly field: string;
  readonly operator: string;
  readonly resetValue: boolean;
}

/**
 * Write seam between the shared row controller and the component that
 * owns the expression storage. `CngxFilterRow` implements it against its
 * local `model()`; `CngxFilterExpressionRow` delegates to the
 * `CNGX_FILTER_BUILDER_HOST` path mutators. The controller never writes
 * state itself - every mutation funnels through exactly one sink call.
 *
 * @category forms/filter-builder/config
 */
export interface CngxFilterRowWriteSink {
  /**
   * Apply a computed field change. When `plan.resetValue` is `false` the
   * carried operator is still valid: only the field changes and operator
   * and value are kept. When `true`, the sink must also write
   * `plan.operator` and clear the value.
   */
  applyFieldChange(plan: CngxFilterRowFieldChangePlan): void;
  setOperator(operator: string): void;
  setValue(value: unknown): void;
  remove(): void;
}

/**
 * Dependencies `createFilterRowController` composes over. `node`, `fields`
 * and `templates` are signals owned by the host component; `fieldMap` is
 * optional - when omitted the controller derives it from `fields`.
 * `config` and `editors` are injection-time snapshots, and `sink` is the
 * component's write seam.
 *
 * @category forms/filter-builder/config
 */
export interface CngxFilterRowControllerDeps {
  readonly node: Signal<FilterExpression | null>;
  readonly fields: Signal<readonly FilterFieldDef[]>;
  readonly fieldMap?: Signal<ReadonlyMap<string, FilterFieldDef>>;
  readonly templates: Signal<CngxFilterBuilderTemplateRegistry | null>;
  readonly config: CngxFilterBuilderConfig;
  readonly editors: ReadonlyMap<string, CngxFilterEditor>;
  readonly sink: CngxFilterRowWriteSink;
}

/**
 * Context the default remove button and the `removeButton` slot template
 * receive. Extends the slot contract with the row's tree path so slot
 * consumers inside the recursive body can correlate the button with its
 * node.
 *
 * @category forms/filter-builder/config
 */
export interface CngxFilterRowRemoveButtonContext extends CngxFilterBuilderRemoveButtonContext {
  readonly path: readonly number[];
}

/**
 * The full row brain shared by `CngxFilterRow` and
 * `CngxFilterExpressionRow`: derived pickers, editor resolution, template
 * cascade, accessible labels, and the write handlers. Everything derived
 * is a `computed()` with an explicit `equal` so unchanged inputs keep
 * their references (no downstream cascades).
 *
 * @category forms/filter-builder/config
 */
export interface CngxFilterRowController {
  readonly fieldOptions: Signal<readonly CngxFilterRowOption[]>;
  readonly operatorOptions: Signal<readonly CngxFilterRowOption[]>;
  readonly operators: Signal<readonly string[]>;
  readonly editor: Signal<CngxFilterEditor | undefined>;
  readonly isIncomplete: Signal<boolean>;
  readonly ariaLabel: Signal<string>;
  readonly removeButtonTemplate: Signal<TemplateRef<CngxFilterBuilderRemoveButtonContext> | null>;
  readonly valueEditorTemplate: Signal<TemplateRef<
    CngxFilterBuilderValueEditorContext<unknown>
  > | null>;
  valueEditorContext(): CngxFilterBuilderValueEditorContext<unknown> | null;
  removeButtonContext(path: readonly number[]): CngxFilterRowRemoveButtonContext;
  operatorLabel(operator: string): string;
  defaultOperatorFor(fieldKey: string): string;
  handleFieldChange(next: string | undefined): void;
  handleOperatorChange(next: string | undefined): void;
  handleStringValueInput(event: Event): void;
  handleNumberValueInput(event: Event): void;
  handleDateValueInput(event: Event): void;
  handleBooleanValueChange(next: boolean): void;
  handleRemove(): void;
}

/**
 * Factory signature carried by {@link CNGX_FILTER_ROW_CONTROLLER_FACTORY}.
 *
 * @category forms/filter-builder/config
 */
export type CngxFilterRowControllerFactory = (
  deps: CngxFilterRowControllerDeps,
) => CngxFilterRowController;

/**
 * Build the shared row brain. Pure composition over the deps - no
 * injection context required, no state ownership: reads come from the
 * dep signals, writes go through the sink. Both shipped row components
 * consume this factory through {@link CNGX_FILTER_ROW_CONTROLLER_FACTORY}
 * so a consumer can swap the row policy (e.g. a different field-change
 * carry-over) without forking either skin.
 *
 * @category forms/filter-builder/config
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/filter-builder/filter-builder-row-controller.ts
 * @since 0.1.0
 * @relatedTo CngxFilterRow, CngxFilterExpressionRow, CNGX_FILTER_ROW_CONTROLLER_FACTORY
 */
export function createFilterRowController(
  deps: CngxFilterRowControllerDeps,
): CngxFilterRowController {
  const fieldMap: Signal<ReadonlyMap<string, FilterFieldDef>> =
    deps.fieldMap ??
    computed<ReadonlyMap<string, FilterFieldDef>>(
      () => new Map(deps.fields().map((field) => [field.key, field])),
      { equal: equalFieldMap },
    );

  function operatorsForField(fieldKey: string): readonly string[] {
    const def = fieldMap().get(fieldKey);
    if (!def) {
      return EMPTY_OPERATORS;
    }
    if (def.operators && def.operators.length > 0) {
      return def.operators;
    }
    return deps.config.defaultOperators[def.editorType] ?? EMPTY_OPERATORS;
  }

  function defaultOperatorFor(fieldKey: string): string {
    const def = fieldMap().get(fieldKey);
    if (!def) {
      return 'eq';
    }
    const first = def.operators?.[0] ?? deps.config.defaultOperators[def.editorType]?.[0];
    return first ?? 'eq';
  }

  function operatorLabel(operator: string): string {
    return (
      deps.config.i18n.operators[operator] ??
      resolveOperatorDef(operator, deps.config.operators)?.label ??
      operator
    );
  }

  function writeValue(next: unknown): void {
    deps.sink.setValue(next);
  }

  const operators = computed<readonly string[]>(
    () => {
      const expression = deps.node();
      return expression ? operatorsForField(expression.field) : EMPTY_OPERATORS;
    },
    { equal: arrayEqual },
  );

  return {
    fieldOptions: computed<readonly CngxFilterRowOption[]>(
      () => deps.fields().map((field) => ({ value: field.key, label: field.label })),
      { equal: equalOptionList },
    ),
    operatorOptions: computed<readonly CngxFilterRowOption[]>(
      () => operators().map((op) => ({ value: op, label: operatorLabel(op) })),
      { equal: equalOptionList },
    ),
    operators,
    editor: computed<CngxFilterEditor | undefined>(
      () => {
        const expression = deps.node();
        if (!expression) {
          return undefined;
        }
        const fieldDef = fieldMap().get(expression.field);
        if (!fieldDef) {
          return undefined;
        }
        return deps.editors.get(fieldDef.editorType);
      },
      { equal: (a, b) => a === b },
    ),
    isIncomplete: computed<boolean>(() => {
      const expression = deps.node();
      if (!expression) {
        return true;
      }
      return (
        !expression.field ||
        !expression.operator ||
        isExpressionValueEmpty(expression, deps.config.operators)
      );
    }),
    ariaLabel: computed<string>(() => {
      const expression = deps.node();
      if (!expression) {
        return deps.config.i18n.unboundFilterLabel;
      }
      const fieldDef = fieldMap().get(expression.field);
      const fieldLabel = fieldDef?.label ?? expression.field;
      return deps.config.i18n.expressionLabel({
        fieldLabel,
        operator: expression.operator,
      });
    }),
    removeButtonTemplate: computed(
      () => deps.templates()?.removeButton() ?? deps.config.templates.removeButton ?? null,
      { equal: (a, b) => a === b },
    ),
    valueEditorTemplate: computed(
      () => deps.templates()?.valueEditor() ?? deps.config.templates.valueEditor ?? null,
      { equal: (a, b) => a === b },
    ),
    valueEditorContext(): CngxFilterBuilderValueEditorContext<unknown> | null {
      const expression = deps.node();
      if (!expression) {
        return null;
      }
      const fieldDef = fieldMap().get(expression.field);
      if (!fieldDef) {
        return null;
      }
      return {
        value: expression.value,
        fieldDef,
        setValue: (v: unknown) => writeValue(v),
        expression,
      };
    },
    removeButtonContext(path: readonly number[]): CngxFilterRowRemoveButtonContext {
      return {
        path,
        label: deps.config.i18n.removeFilter,
        remove: () => deps.sink.remove(),
      };
    },
    operatorLabel,
    defaultOperatorFor,
    handleFieldChange(next: string | undefined): void {
      if (next === undefined) {
        return;
      }
      const current = deps.node();
      const carriedOperator = current?.operator;
      const newValidOperators = operatorsForField(next);
      const operatorIsStillValid =
        carriedOperator !== undefined && newValidOperators.includes(carriedOperator);
      const operator =
        operatorIsStillValid && carriedOperator !== undefined
          ? carriedOperator
          : defaultOperatorFor(next);
      deps.sink.applyFieldChange({
        field: next,
        operator,
        resetValue: !operatorIsStillValid,
      });
    },
    handleOperatorChange(next: string | undefined): void {
      if (next === undefined) {
        return;
      }
      deps.sink.setOperator(next);
    },
    handleStringValueInput(event: Event): void {
      const target = event.target as HTMLInputElement;
      writeValue(target.value);
    },
    handleNumberValueInput(event: Event): void {
      const target = event.target as HTMLInputElement;
      const raw = target.value;
      writeValue(raw === '' ? null : Number(raw));
    },
    handleDateValueInput(event: Event): void {
      const target = event.target as HTMLInputElement;
      const raw = target.value;
      writeValue(raw === '' ? null : raw);
    },
    handleBooleanValueChange(next: boolean): void {
      writeValue(next);
    },
    handleRemove(): void {
      deps.sink.remove();
    },
  };
}

/**
 * DI seam for the shared row brain. Default:
 * {@link createFilterRowController}. Swap at root or component scope to
 * change row policy (carry-over rules, label resolution, editor
 * dispatch) for every row skin in scope without forking `CngxFilterRow`
 * or `CngxFilterExpressionRow`.
 *
 * @category forms/filter-builder/config
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/filter-builder/filter-builder-row-controller.ts
 * @since 0.1.0
 * @relatedTo createFilterRowController, CngxFilterRow, CngxFilterExpressionRow
 */
export const CNGX_FILTER_ROW_CONTROLLER_FACTORY =
  new InjectionToken<CngxFilterRowControllerFactory>('CNGX_FILTER_ROW_CONTROLLER_FACTORY', {
    providedIn: 'root',
    factory: () => createFilterRowController,
  });
