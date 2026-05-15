import { NgComponentOutlet, NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  untracked,
  ViewEncapsulation,
} from '@angular/core';
import { CngxToggle } from '@cngx/common/interactive';
import { CngxInput } from '@cngx/forms/input';
import { CngxSelect } from '@cngx/forms/select';

import { CNGX_FILTER_BUILDER_GLYPHS } from './filter-builder.glyphs';
import {
  injectFilterBuilderConfig,
  isNativeEditor,
  type CngxFilterEditor,
} from './filter-builder.config';
import type { CngxFilterBuilderTemplateRegistry } from './filter-builder-template-registry';
import type { CngxFilterBuilderValueEditorContext } from './filter-builder-value-editor.slot';
import { createFilterExpression } from './filter-builder.helpers';
import { injectFilterEditors } from './filter-builder.tokens';
import type {
  FilterExpression,
  FilterFieldDef,
} from './filter-builder.types';

const EMPTY_OPERATORS: readonly string[] = Object.freeze([]) as readonly string[];

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

function equalStringList(a: readonly string[], b: readonly string[]): boolean {
  if (a === b) {
    return true;
  }
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

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
 * Standalone filter row — column-header surface for `@cngx/forms/filter-builder`.
 * Owns a single `FilterExpression | null` via `[(value)]` and renders the
 * field-picker / operator-picker / value-editor / remove-button stack
 * without any presenter or host-token wiring.
 *
 * Typical use: a table-column header that filters one column. For an empty
 * `[(value)]` with more than one field, the row renders just the field-picker
 * (the bound expression seeds once the user picks a field). For an empty
 * `[(value)]` with exactly one field, the row auto-seeds the expression so
 * the operator + value editors render directly — a one-option field picker
 * is dead UX when the field is implicit from the consumer's context.
 *
 * Embedded recursive usage lives in `CngxFilterExpressionRow`; this component
 * does not interoperate with `CNGX_FILTER_BUILDER_HOST`.
 */
@Component({
  selector: 'cngx-filter-row',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgComponentOutlet, NgTemplateOutlet, CngxInput, CngxSelect, CngxToggle],
  templateUrl: './filter-builder-row.component.html',
  styleUrl: './filter-builder-row.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class CngxFilterRow {
  protected readonly config = injectFilterBuilderConfig();
  protected readonly editors = injectFilterEditors();
  protected readonly glyphs = CNGX_FILTER_BUILDER_GLYPHS;
  protected readonly isNativeEditor = isNativeEditor;

  readonly value = model<FilterExpression | null>(null);

  readonly fields = input.required<readonly FilterFieldDef[]>();

  readonly templates = input<CngxFilterBuilderTemplateRegistry | null>(null);

  protected readonly removeButtonTemplate = computed(
    () => this.templates()?.removeButton() ?? this.config.templates.removeButton ?? null,
    { equal: (a, b) => a === b },
  );

  protected readonly valueEditorTemplate = computed(
    () => this.templates()?.valueEditor() ?? this.config.templates.valueEditor ?? null,
    { equal: (a, b) => a === b },
  );

  protected valueEditorContext(): CngxFilterBuilderValueEditorContext<unknown> | null {
    const expression = this.node();
    if (!expression) {
      return null;
    }
    const fieldDef = this.fieldMap().get(expression.field);
    if (!fieldDef) {
      return null;
    }
    return {
      value: expression.value,
      fieldDef,
      setValue: (v: unknown) => this.writeValue(v),
      expression,
    };
  }

  protected readonly showEmptyFieldPicker = computed(
    () => this.value() === null && this.fields().length > 1,
  );

  constructor() {
    // Single-field auto-seed on first render. `afterNextRender` is single-shot
    // and outside the reactive graph, so it does not violate Pillar 1's
    // "no signal writes inside `effect`" rule. The previous reactive auto-seed
    // also re-seeded after a Remove click, which fought the user — that
    // behaviour is dropped intentionally.
    afterNextRender(() => {
      if (untracked(() => this.value()) !== null) {
        return;
      }
      const fs = untracked(() => this.fields());
      if (fs.length !== 1) {
        return;
      }
      const only = fs[0];
      if (!only) {
        return;
      }
      this.value.set(createFilterExpression(only.key, this.defaultOperatorFor(only.key)));
    });
  }

  protected readonly node = computed<FilterExpression | null>(
    () => this.value(),
    { equal: (a, b) => a === b },
  );

  private readonly fieldMap = computed<ReadonlyMap<string, FilterFieldDef>>(
    () => new Map(this.fields().map((field) => [field.key, field])),
    { equal: equalFieldMap },
  );

  protected readonly fieldOptions = computed<readonly { readonly value: string; readonly label: string }[]>(
    () => this.fields().map((field) => ({ value: field.key, label: field.label })),
    { equal: equalOptionList },
  );

  protected readonly operatorOptions = computed<readonly { readonly value: string; readonly label: string }[]>(
    () => this.operators().map((op) => ({ value: op, label: this.operatorLabel(op) })),
    { equal: equalOptionList },
  );

  protected readonly editor = computed<CngxFilterEditor | undefined>(
    () => {
      const expression = this.node();
      if (!expression) {
        return undefined;
      }
      const fieldDef = this.fieldMap().get(expression.field);
      if (!fieldDef) {
        return undefined;
      }
      return this.editors.get(fieldDef.editorType);
    },
    { equal: (a, b) => a === b },
  );

  protected readonly operators = computed<readonly string[]>(
    () => {
      const expression = this.node();
      return expression ? this.operatorsForField(expression.field) : EMPTY_OPERATORS;
    },
    { equal: equalStringList },
  );

  private operatorsForField(fieldKey: string): readonly string[] {
    const def = this.fieldMap().get(fieldKey);
    if (!def) {
      return EMPTY_OPERATORS;
    }
    if (def.operators && def.operators.length > 0) {
      return def.operators;
    }
    return this.config.defaultOperators[def.editorType] ?? EMPTY_OPERATORS;
  }

  protected operatorLabel(op: string): string {
    return this.config.i18n.operators[op] ?? op;
  }

  protected readonly isIncomplete = computed<boolean>(() => {
    const expression = this.node();
    if (!expression) {
      return true;
    }
    return !expression.field || !expression.operator;
  });

  protected readonly ariaLabel = computed<string>(() => {
    const expression = this.node();
    if (!expression) {
      return this.config.i18n.unboundFilterLabel;
    }
    const fieldDef = this.fieldMap().get(expression.field);
    const fieldLabel = fieldDef?.label ?? expression.field;
    return this.config.i18n.expressionLabel({
      fieldLabel,
      operator: expression.operator,
    });
  });

  protected handleFieldChange(next: string | undefined): void {
    if (next === undefined) {
      return;
    }
    const current = this.node();
    const carriedOperator = current?.operator;
    const newValidOperators = this.operatorsForField(next);
    const operatorIsStillValid =
      carriedOperator !== undefined && newValidOperators.includes(carriedOperator);
    const defaultOperator = operatorIsStillValid && carriedOperator !== undefined
      ? carriedOperator
      : this.defaultOperatorFor(next);

    if (!current) {
      this.value.set(createFilterExpression(next, defaultOperator));
      return;
    }
    this.value.set({
      ...current,
      field: next,
      operator: defaultOperator,
      value: operatorIsStillValid ? current.value : undefined,
    });
  }

  private defaultOperatorFor(fieldKey: string): string {
    const def = this.fieldMap().get(fieldKey);
    if (!def) {
      return 'eq';
    }
    const first = def.operators?.[0] ?? this.config.defaultOperators[def.editorType]?.[0];
    return first ?? 'eq';
  }

  protected handleOperatorChange(next: string | undefined): void {
    if (next === undefined) {
      return;
    }
    const current = this.value();
    if (!current) {
      return;
    }
    this.value.set({ ...current, operator: next });
  }

  protected handleStringValueInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.writeValue(target.value);
  }

  protected handleNumberValueInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const raw = target.value;
    this.writeValue(raw === '' ? null : Number(raw));
  }

  protected handleDateValueInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const raw = target.value;
    this.writeValue(raw === '' ? null : raw);
  }

  protected handleBooleanValueChange(next: boolean): void {
    this.writeValue(next);
  }

  private writeValue(next: unknown): void {
    const current = this.value();
    if (!current) {
      return;
    }
    this.value.set({ ...current, value: next });
  }

  protected handleRemove(): void {
    this.value.set(null);
  }

  protected removeButtonContext(): { path: readonly number[]; label: string; remove: () => void } {
    return {
      path: [],
      label: this.config.i18n.removeFilter,
      remove: () => this.handleRemove(),
    };
  }
}
