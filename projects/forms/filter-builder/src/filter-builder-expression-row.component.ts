import { NgComponentOutlet, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { CngxInput } from '@cngx/forms/input';
import { CngxSelect, type CngxSelectOptionsInput } from '@cngx/forms/select';

import { CngxFilterExpression } from './filter-builder-expression.directive';
import { CNGX_FILTER_BUILDER_GLYPHS } from './filter-builder.glyphs';
import {
  injectFilterBuilderConfig,
  isNativeEditor,
  type CngxFilterEditor,
} from './filter-builder.config';
import { CNGX_FILTER_BUILDER_HOST } from './filter-builder-host.token';
import type { CngxFilterBuilderTemplateRegistry } from './filter-builder-template-registry';
import { injectFilterEditors } from './filter-builder.tokens';
import type {
  FilterExpression,
  FilterFieldDef,
  FilterNode,
} from './filter-builder.types';

const EMPTY_OPERATORS: readonly string[] = Object.freeze([]) as readonly string[];

/**
 * Expression-row sub-component. One per `FilterExpression` node in the
 * recursive renderer. Reads the node and its surrounding field/operator
 * registry via the {@link CNGX_FILTER_BUILDER_HOST} contract (Pillar 3,
 * `reference_atomic_decompose` rule 4 — sub-rendering goes through a token,
 * never a concrete parent class). Extracted from the inline `expressionTpl`
 * block of `CngxFilterBuilderBody` so the row's DOM stays mounted across
 * content edits — only the row's inner `[value]` updates re-render its
 * editors when an upstream mutator allocates fresh ancestors. The
 * extraction is the structural piece that locks Phase 1's `track child.id`
 * fix into the component graph.
 */
@Component({
  selector: 'cngx-filter-expression-row',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgComponentOutlet, NgTemplateOutlet, CngxFilterExpression, CngxInput, CngxSelect],
  templateUrl: './filter-builder-expression-row.component.html',
  styleUrl: './filter-builder-expression-row.component.css',
})
export class CngxFilterExpressionRow {
  private readonly host = inject(CNGX_FILTER_BUILDER_HOST);
  protected readonly config = injectFilterBuilderConfig();
  protected readonly editors = injectFilterEditors();
  protected readonly glyphs = CNGX_FILTER_BUILDER_GLYPHS;
  protected readonly isNativeEditor = isNativeEditor;

  readonly path = input.required<readonly number[]>();

  /**
   * Slot registry passed down from the parent `CngxFilterBuilder`. When the
   * registry's `removeButton` resolves to a `TemplateRef`, the row renders
   * the consumer-supplied button; otherwise it falls back to the default
   * `<button>` element. Standalone-mode consumers (Phase 5) leave this
   * unset.
   */
  readonly templates = input<CngxFilterBuilderTemplateRegistry | null>(null);

  protected readonly removeButtonTemplate = computed(() => this.templates()?.removeButton() ?? null);

  protected readonly node = computed<FilterExpression | null>(() => {
    const resolved: FilterNode | null = this.host.getNodeAtPath(this.path());
    return resolved?.type === 'expression' ? resolved : null;
  });

  protected readonly fields = computed<readonly FilterFieldDef[]>(() => this.host.fields());

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
    const fieldDef = this.host.fieldMap().get(expression.field);
    if (!fieldDef) {
      return undefined;
    }
    return this.editors.get(fieldDef.editorType);
  });

  protected readonly operators = computed<readonly string[]>(() => {
    const expression = this.node();
    if (!expression) {
      return EMPTY_OPERATORS;
    }
    const def = this.host.fieldMap().get(expression.field);
    if (!def) {
      return EMPTY_OPERATORS;
    }
    if (def.operators && def.operators.length > 0) {
      return def.operators;
    }
    return this.config.defaultOperators[def.editorType] ?? EMPTY_OPERATORS;
  });

  protected operatorLabel(op: string): string {
    return this.config.i18n.operators[op] ?? op;
  }

  protected handleFieldChange(value: string | undefined): void {
    if (value === undefined) {
      return;
    }
    this.host.setField(this.path(), value);
  }

  protected handleOperatorChange(value: string | undefined): void {
    if (value === undefined) {
      return;
    }
    this.host.setOperator(this.path(), value);
  }

  protected handleStringValueInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.host.setValue(this.path(), target.value);
  }

  protected handleNumberValueInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const raw = target.value;
    this.host.setValue(this.path(), raw === '' ? null : Number(raw));
  }

  protected handleRemove(): void {
    this.host.removeNode(this.path());
  }

  protected removeButtonContext(): { path: readonly number[]; label: string; remove: () => void } {
    return {
      path: this.path(),
      label: this.config.i18n.removeFilter,
      remove: () => this.handleRemove(),
    };
  }
}
