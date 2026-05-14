import { NgComponentOutlet, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  model,
  untracked,
  ViewEncapsulation,
} from '@angular/core';
import { CngxToggle } from '@cngx/common/interactive';
import { CngxInput } from '@cngx/forms/input';
import { CngxSelect, type CngxSelectOptionsInput } from '@cngx/forms/select';

import { CNGX_FILTER_BUILDER_GLYPHS } from './filter-builder.glyphs';
import {
  injectFilterBuilderConfig,
  isNativeEditor,
  type CngxFilterEditor,
} from './filter-builder.config';
import { CNGX_FILTER_BUILDER_HOST } from './filter-builder-host.token';
import type { CngxFilterBuilderTemplateRegistry } from './filter-builder-template-registry';
import { createFilterExpression } from './filter-builder.helpers';
import { injectFilterEditors } from './filter-builder.tokens';
import type {
  FilterExpression,
  FilterFieldDef,
  FilterNode,
} from './filter-builder.types';

const EMPTY_OPERATORS: readonly string[] = Object.freeze([]) as readonly string[];
const EMPTY_PATH: readonly number[] = Object.freeze([]) as readonly number[];

/**
 * Expression-row sub-component. Dual-mode: **embedded** (inside the
 * builder, reads through {@link CNGX_FILTER_BUILDER_HOST}) and **standalone**
 * (mounted outside the builder, owns its own value via `[(value)]`).
 *
 * Embedded mode is the default; the builder body mounts the row inside
 * each `<cngx-filter-builder>` for the expression branch and resolves
 * the node by `[path]`. Standalone mode kicks in when no host token is
 * provided — typical use: a single filter row inside a table-column header.
 * Standalone mode requires `[fields]` and a writable `[(value)]` binding.
 *
 * Pillar 3 (Komposition statt Konfiguration): one Component, two
 * compositional contexts. `reference_atomic_decompose` rule 4
 * (DI Abstraction): the host contract is the single seam between the two
 * modes; the templates and editor wiring stay identical.
 */
@Component({
  selector: 'cngx-filter-expression-row',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgComponentOutlet, NgTemplateOutlet, CngxInput, CngxSelect, CngxToggle],
  templateUrl: './filter-builder-expression-row.component.html',
  styleUrl: './filter-builder-expression-row.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class CngxFilterExpressionRow {
  private readonly host = inject(CNGX_FILTER_BUILDER_HOST, { optional: true });
  protected readonly config = injectFilterBuilderConfig();
  protected readonly editors = injectFilterEditors();
  protected readonly glyphs = CNGX_FILTER_BUILDER_GLYPHS;
  protected readonly isNativeEditor = isNativeEditor;

  /**
   * Path of the expression within the host tree. Required in embedded mode,
   * unused in standalone mode (defaults to the empty path so the directive
   * binding on the wrapper still resolves to a non-null reference).
   */
  readonly path = input<readonly number[]>(EMPTY_PATH);

  /**
   * Standalone-mode value. Two-way bindable via `[(value)]`. Ignored when
   * the host token is provided — embedded mode reads from
   * `host.getNodeAtPath(path)` instead.
   */
  readonly value = model<FilterExpression | null>(null);

  /**
   * Standalone-mode fields list. Ignored when the host token is provided —
   * embedded mode reads from `host.fields()`. Per `reference_forms_architecture`
   * the input is alias-less since the standalone surface is a deliberate
   * pure-form composition.
   */
  readonly fieldsInput = input<readonly FilterFieldDef[]>([], { alias: 'fields' });

  /**
   * Slot registry passed down from the parent `CngxFilterBuilder` in
   * embedded mode. When the registry's `removeButton` resolves to a
   * `TemplateRef`, the row renders the consumer-supplied button; otherwise
   * it falls back to the default `<button>` element. Standalone-mode
   * consumers leave this unset.
   */
  readonly templates = input<CngxFilterBuilderTemplateRegistry | null>(null);

  protected readonly removeButtonTemplate = computed(() => this.templates()?.removeButton() ?? null);

  /** `true` when no `CNGX_FILTER_BUILDER_HOST` is provided — standalone mode. */
  protected readonly standalone = computed(() => this.host === null);

  /**
   * Empty-state branch for standalone mode: when `[(value)]` is null and
   * MORE THAN ONE field is available, render only the field picker so
   * consumers can start a filter without having to seed an expression
   * themselves. Single-field standalone mode skips this entirely — the
   * row auto-seeds the only field via the constructor effect below
   * because a one-option field-picker is dead UX (the field is implicit
   * from the consumer's column-header / single-purpose row context).
   */
  protected readonly showEmptyFieldPicker = computed(
    () => this.standalone() && this.value() === null && this.fields().length > 1,
  );

  constructor() {
    // Auto-seed single-field standalone rows. The consumer mounted a row
    // pinned to one field (table-column header pattern); a field-picker
    // would be redundant. As soon as `value` is null AND fields has exactly
    // one entry, materialise a fresh expression so the operator + value
    // editors render directly. `untracked` shields the write from feeding
    // back into the effect's dependency graph.
    effect(() => {
      if (this.host) {
        return;
      }
      if (this.value() !== null) {
        return;
      }
      const fs = this.fieldsInput();
      if (fs.length !== 1) {
        return;
      }
      const only = fs[0];
      if (!only) {
        return;
      }
      untracked(() => {
        this.value.set(createFilterExpression(only.key, this.defaultOperatorFor(only.key)));
      });
    });
  }

  protected readonly node = computed<FilterExpression | null>(() => {
    if (this.host) {
      const resolved: FilterNode | null = this.host.getNodeAtPath(this.path());
      return resolved?.type === 'expression' ? resolved : null;
    }
    return this.value();
  });

  protected readonly fields = computed<readonly FilterFieldDef[]>(() =>
    this.host ? this.host.fields() : this.fieldsInput(),
  );

  private readonly fieldMap = computed<ReadonlyMap<string, FilterFieldDef>>(() => {
    if (this.host) {
      return this.host.fieldMap();
    }
    return new Map(this.fieldsInput().map((field) => [field.key, field]));
  });

  protected readonly fieldOptions = computed<CngxSelectOptionsInput<string>>(() =>
    this.fields().map((field) => ({ value: field.key, label: field.label })),
  );

  protected readonly operatorOptions = computed<CngxSelectOptionsInput<string>>(() =>
    this.operators().map((op) => ({ value: op, label: this.operatorLabel(op) })),
  );

  protected readonly editor = computed<CngxFilterEditor | undefined>(() => {
    const expression = this.node();
    if (!expression) {
      return undefined;
    }
    const fieldDef = this.fieldMap().get(expression.field);
    if (!fieldDef) {
      return undefined;
    }
    return this.editors.get(fieldDef.editorType);
  });

  protected readonly operators = computed<readonly string[]>(() => {
    const expression = this.node();
    return expression ? this.operatorsForField(expression.field) : EMPTY_OPERATORS;
  });

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

    if (this.host) {
      this.host.setField(this.path(), next);
      if (!operatorIsStillValid) {
        // The carry-over operator is invalid for the new field's editor type
        // (e.g. switching `Birthday` → `Role` leaves `lt` orphaned in a string
        // operator list). Reset to the new field's default and clear the
        // value so the editor branch swaps to the matching native input.
        this.host.setOperator(this.path(), defaultOperator);
        this.host.setValue(this.path(), undefined);
      }
      return;
    }
    if (!current) {
      // Standalone empty-state: seed a fresh expression with the chosen field
      // plus the field's default operator. Subsequent edits flow through the
      // normal mutator paths.
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
    if (this.host) {
      this.host.setOperator(this.path(), next);
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
    // Native <input type="date"> fires `change` reliably on calendar-pick
    // and `input` reliably on direct keyboard editing; binding both covers
    // the cross-browser delta. The handler is idempotent — writeValue
    // short-circuits when the value is unchanged at the host level.
    this.writeValue(raw === '' ? null : raw);
  }

  protected handleBooleanValueChange(next: boolean): void {
    this.writeValue(next);
  }

  private writeValue(next: unknown): void {
    if (this.host) {
      this.host.setValue(this.path(), next);
      return;
    }
    const current = this.value();
    if (!current) {
      return;
    }
    this.value.set({ ...current, value: next });
  }

  protected handleRemove(): void {
    if (this.host) {
      this.host.removeNode(this.path());
      return;
    }
    this.value.set(null);
  }

  protected removeButtonContext(): { path: readonly number[]; label: string; remove: () => void } {
    return {
      path: this.path(),
      label: this.config.i18n.removeFilter,
      remove: () => this.handleRemove(),
    };
  }
}
