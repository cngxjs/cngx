import { Directive, inject, TemplateRef } from '@angular/core';

import type { FilterExpression, FilterFieldDef } from './filter-builder.types';

/**
 * Context object handed to the consumer template when the
 * `cngxFilterBuilderValueEditor` slot resolves. Mirrors the data the
 * default native / component-outlet branches consume — `value` is the
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
 * Per-row value-editor slot. Closes the slot-cascade symmetry the audit
 * flagged on the value-editor surface (debt §13). When present, the
 * row prefers this template over the native / component-outlet branches;
 * the cascade falls back to `CONFIG.templates.valueEditor` and finally
 * to the default editor branches when neither is provided.
 *
 * @category forms/filter-builder/slots
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
