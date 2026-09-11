import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { CngxToggle } from '@cngx/common/interactive';
import { CngxInput } from '@cngx/forms/input';
import { CngxSelect } from '@cngx/forms/select';

import { CNGX_FILTER_BUILDER_GLYPHS } from './filter-builder.glyphs';
import { CngxFilterValueEditorHost } from './filter-builder-value-editor-host.directive';
import { injectFilterBuilderConfig, isNativeEditor } from './filter-builder.config';
import { CNGX_FILTER_BUILDER_HOST } from './filter-builder-host.token';
import {
  CNGX_FILTER_ROW_CONTROLLER_FACTORY,
  type CngxFilterRowWriteSink,
} from './filter-builder-row-controller';
import type { CngxFilterBuilderTemplateRegistry } from './filter-builder-template-registry';
import { injectFilterEditors } from './filter-builder.tokens';
import type { FilterExpression, FilterFieldDef, FilterNode } from './filter-builder.types';

/**
 * Embedded expression-row sub-component. Mounted by the builder body for
 * every expression node in the recursive tree; resolves its value from
 * `CNGX_FILTER_BUILDER_HOST` via `[path]`.
 *
 * Pillar 3 (Komposition statt Konfiguration): one component, one
 * responsibility - render the recursive renderer's expression row. The
 * column-header / quick-filter surface lives in `CngxFilterRow`.
 *
 * The row brain comes from `CNGX_FILTER_ROW_CONTROLLER_FACTORY`; this
 * component is the skin plus a `CNGX_FILTER_BUILDER_HOST` path-mutator
 * write sink.
 *
 * @category forms/filter-builder
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/filter-builder/filter-builder-expression-row.component.ts
 * @since 0.1.0
 * @relatedTo CngxFilterBuilderBody, CngxFilterRow, CngxFilterBuilderPresenter
 */
@Component({
  selector: 'cngx-filter-expression-row',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, CngxFilterValueEditorHost, CngxInput, CngxSelect, CngxToggle],
  templateUrl: './filter-builder-expression-row.component.html',
  styleUrls: ['./filter-builder-expression-row.component.css'],
  encapsulation: ViewEncapsulation.None,
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
   * `<button>` element.
   */
  readonly templates = input<CngxFilterBuilderTemplateRegistry | null>(null);

  protected readonly pathAttr = computed(() => this.path().join('.'));

  protected readonly node = computed<FilterExpression | null>(
    () => {
      const resolved: FilterNode | null = this.host.getNodeAtPath(this.path());
      return resolved?.type === 'expression' ? resolved : null;
    },
    { equal: (a, b) => a === b },
  );

  protected readonly fields = computed<readonly FilterFieldDef[]>(() => this.host.fields(), {
    equal: (a, b) => a === b,
  });

  private readonly fieldMap = computed<ReadonlyMap<string, FilterFieldDef>>(
    () => this.host.fieldMap(),
    { equal: (a, b) => a === b },
  );

  private readonly sink: CngxFilterRowWriteSink = {
    // Atomic on the host: one tree write, one mutation event, one
    // announcement per field-change gesture - matching the standalone
    // row's single model write.
    applyFieldChange: (plan) => this.host.applyFieldChange(this.path(), plan),
    setOperator: (operator) => this.host.setOperator(this.path(), operator),
    setValue: (value) => this.host.setValue(this.path(), value),
    remove: () => this.host.removeNode(this.path()),
  };

  private readonly row = inject(CNGX_FILTER_ROW_CONTROLLER_FACTORY)({
    node: this.node,
    fields: this.fields,
    fieldMap: this.fieldMap,
    path: this.path,
    templates: this.templates,
    config: this.config,
    editors: this.editors,
    sink: this.sink,
  });

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
    // Native <input type="date"> fires `change` reliably on calendar-pick
    // and `input` reliably on direct keyboard editing; the template binds
    // both to cover the cross-browser delta. The handler is idempotent -
    // the host short-circuits when the value is unchanged.
    this.row.handleDateValueInput(event);
  }

  protected handleBooleanValueChange(next: boolean): void {
    this.row.handleBooleanValueChange(next);
  }

  protected handleRemove(): void {
    this.row.handleRemove();
  }
}
