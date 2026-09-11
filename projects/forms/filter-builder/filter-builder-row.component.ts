import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  untracked,
  ViewEncapsulation,
} from '@angular/core';
import { CngxToggle } from '@cngx/common/interactive';
import { CngxInput } from '@cngx/forms/input';
import { CngxSelect } from '@cngx/forms/select';

import { CNGX_FILTER_BUILDER_GLYPHS } from './filter-builder.glyphs';
import { CngxFilterValueEditorHost } from './filter-builder-value-editor-host.directive';
import { injectFilterBuilderConfig, isNativeEditor } from './filter-builder.config';
import {
  CNGX_FILTER_ROW_CONTROLLER_FACTORY,
  type CngxFilterRowWriteSink,
} from './filter-builder-row-controller';
import type { CngxFilterBuilderTemplateRegistry } from './filter-builder-template-registry';
import { createFilterExpression } from './filter-builder.helpers';
import { injectFilterEditors } from './filter-builder.tokens';
import type { FilterExpression, FilterFieldDef } from './filter-builder.types';

/**
 * Standalone single-row filter surface. Owns one
 * `FilterExpression | null` via `[(value)]` and renders the
 * field-picker / operator-picker / value-editor / remove-button stack
 * with no presenter or host-token wiring.
 *
 * Use for ad-hoc top-of-table or side-panel filters where a full
 * `<cngx-filter-builder>` tree is overkill. Not the right primitive
 * for column-header filters with a fixed field per column - that UX
 * (clear-value semantics, no field picker, predicate writes directly
 * into `CngxFilter`) needs a dedicated artifact.
 *
 * Empty `[(value)]` with >1 field renders just the field-picker; the
 * expression seeds when the user picks. Exactly one field auto-seeds
 * on first render and skips the picker. Embedded recursive usage lives
 * in `CngxFilterExpressionRow` and does not interop with
 * `CNGX_FILTER_BUILDER_HOST`.
 *
 * The row brain (pickers, editor resolution, carry-over policy,
 * labels, write handlers) comes from
 * `CNGX_FILTER_ROW_CONTROLLER_FACTORY`; this component is the skin plus
 * a local-`model()` write sink.
 *
 * @category forms/filter-builder
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/filter-builder/filter-builder-row.component.ts
 * @since 0.1.0
 * @relatedTo CngxFilterBuilder, CngxFilterExpressionRow, CngxFilterBuilderValueEditor
 * <example-url>http://localhost:4200/#/forms/filter-builder/filter-row-standalone/single-row-with-value</example-url>
 */
@Component({
  selector: 'cngx-filter-row',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, CngxFilterValueEditorHost, CngxInput, CngxSelect, CngxToggle],
  templateUrl: './filter-builder-row.component.html',
  styleUrls: ['./filter-builder-row.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class CngxFilterRow {
  protected readonly config = injectFilterBuilderConfig();
  protected readonly editors = injectFilterEditors();
  protected readonly glyphs = CNGX_FILTER_BUILDER_GLYPHS;
  protected readonly isNativeEditor = isNativeEditor;

  /** Two-way bound expression. `null` shows the empty-state field-picker. */
  readonly value = model<FilterExpression | null>(null);

  /**
   * Field list the row offers in its picker. Single-entry arrays trigger
   * the auto-seed branch and skip the picker entirely (one option = no
   * choice).
   */
  readonly fields = input.required<readonly FilterFieldDef[]>();

  /**
   * Optional consumer-supplied template registry, e.g. from a parent
   * `<cngx-filter-builder>` so the standalone row reuses the host's
   * `removeButton` / `valueEditor` overrides.
   */
  readonly templates = input<CngxFilterBuilderTemplateRegistry | null>(null);

  protected readonly node = computed<FilterExpression | null>(() => this.value(), {
    equal: (a, b) => a === b,
  });

  private readonly sink: CngxFilterRowWriteSink = {
    applyFieldChange: (plan) => {
      const current = this.value();
      if (!current) {
        this.value.set(createFilterExpression(plan.field, plan.operator));
        return;
      }
      this.value.set({
        ...current,
        field: plan.field,
        operator: plan.operator,
        value: plan.resetValue ? undefined : current.value,
      });
    },
    setOperator: (operator) => {
      const current = this.value();
      if (!current) {
        return;
      }
      this.value.set({ ...current, operator });
    },
    setValue: (value) => {
      const current = this.value();
      if (!current) {
        return;
      }
      this.value.set({ ...current, value });
    },
    remove: () => this.value.set(null),
  };

  private readonly row = inject(CNGX_FILTER_ROW_CONTROLLER_FACTORY)({
    node: this.node,
    fields: this.fields,
    templates: this.templates,
    config: this.config,
    editors: this.editors,
    sink: this.sink,
  });

  protected readonly showEmptyFieldPicker = computed(
    () => this.value() === null && this.fields().length > 1,
  );

  constructor() {
    // afterNextRender (not effect) - single-shot, outside the reactive graph,
    // so Pillar 1's "no signal writes in effect" rule stays clean. A reactive
    // re-seed would also fight the user after a Remove click.
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
      this.value.set(createFilterExpression(only.key, this.row.defaultOperatorFor(only.key)));
    });
  }

  protected readonly fieldOptions = this.row.fieldOptions;
  protected readonly operatorOptions = this.row.operatorOptions;
  protected readonly operators = this.row.operators;
  protected readonly editor = this.row.editor;
  protected readonly isIncomplete = this.row.isIncomplete;
  protected readonly ariaLabel = this.row.ariaLabel;
  protected readonly removeButtonTemplate = this.row.removeButtonTemplate;
  protected readonly valueEditorTemplate = this.row.valueEditorTemplate;

  protected readonly valueEditorContext = this.row.valueEditorContext;
  protected readonly removeButtonContext = this.row.removeButtonContext;

  protected handleFieldChange(next: string | undefined): void {
    this.row.handleFieldChange(next);
  }

  protected handleOperatorChange(next: string | undefined): void {
    this.row.handleOperatorChange(next);
  }

  protected handleStringValueInput(event: Event): void {
    this.row.handleStringValueInput(event);
  }

  protected handleNumberValueInput(event: Event): void {
    this.row.handleNumberValueInput(event);
  }

  protected handleDateValueInput(event: Event): void {
    this.row.handleDateValueInput(event);
  }

  protected handleBooleanValueChange(next: boolean): void {
    this.row.handleBooleanValueChange(next);
  }

  protected handleRemove(): void {
    this.row.handleRemove();
  }
}
