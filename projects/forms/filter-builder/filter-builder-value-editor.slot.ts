import { Directive, inject, TemplateRef } from '@angular/core';

import type { FilterExpression, FilterFieldDef } from './filter-builder.types';

/**
 * Context object handed to the consumer template when the
 * `cngxFilterBuilderValueEditor` slot resolves. Mirrors the data the
 * default native / component-outlet branches consume - `value` is the
 * current expression value, `fieldDef` carries the field metadata,
 * `setValue` is the row's write-through callback, and `expression`
 * exposes the full node for consumers that need the operator alongside
 * the value (e.g. range editors that toggle UI on `'between'`).
 *
 * @category forms/filter-builder/slots
 */
export interface CngxFilterBuilderValueEditorContext<TValue> {
  readonly value: TValue;
  readonly fieldDef: FilterFieldDef;
  readonly setValue: (v: TValue) => void;
  readonly expression: FilterExpression;
}

/**
 * Per-row value-editor slot - overrides just the value cell of an expression
 * row; the field and operator pickers stay. Context: `value`, `fieldDef`,
 * `setValue()`, `expression` (the full node, for editors that switch on the
 * operator, e.g. a range editor on `'between'`).
 *
 * ```html
 * <ng-template cngxFilterBuilderValueEditor let-value="value" let-setValue="setValue">
 *   <my-date-input [value]="value" (valueChange)="setValue($event)" />
 * </ng-template>
 * ```
 *
 * For a whole-row override use `cngxFilterBuilderExpressionTemplate`; to swap
 * the editor by field type instead, register on `CNGX_FILTER_EDITORS`. When
 * present this template wins over `CONFIG.templates.valueEditor` and the default
 * editor branches.
 *
 * @category forms/filter-builder/slots
 * @docsKind primary
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/filter-builder/filter-builder-value-editor.slot.ts
 * @since 0.1.0
 * @relatedTo CngxFilterBuilder, CngxFilterBuilderExpressionTemplate, CngxFilterBuilderRemoveButton
 */
@Directive({
  selector: 'ng-template[cngxFilterBuilderValueEditor]',
  exportAs: 'cngxFilterBuilderValueEditor',
  standalone: true,
})
export class CngxFilterBuilderValueEditor {
  readonly templateRef =
    inject<TemplateRef<CngxFilterBuilderValueEditorContext<unknown>>>(TemplateRef);

  static ngTemplateContextGuard(
    _dir: CngxFilterBuilderValueEditor,
    _ctx: unknown,
  ): _ctx is CngxFilterBuilderValueEditorContext<unknown> {
    return true;
  }
}
