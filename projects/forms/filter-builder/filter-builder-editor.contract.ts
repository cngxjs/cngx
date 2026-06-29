import type { InputSignal, ModelSignal } from '@angular/core';

import type { FilterExpression, FilterFieldDef } from './filter-builder.types';

/**
 * Contract every consumer-supplied custom editor component must satisfy
 * when registered against {@link CNGX_FILTER_EDITORS}.
 *
 * Shape mirrors Angular 21 Signal Forms' `FormValueControl<T>`: the
 * required `value` is a `ModelSignal` so two-way binding wires through
 * `[(value)]` without a
 * `ControlValueAccessor`. The optional `fieldDef`, `expression`, and
 * `disabled` inputs are projected by the filter-builder row when the
 * editor is mounted; consumers declare only the inputs they care about.
 *
 * @category forms/filter-builder/slots
 */
export interface CngxFilterEditorComponent<TValue> {
  readonly value: ModelSignal<TValue | null>;
  readonly fieldDef?: InputSignal<FilterFieldDef | undefined>;
  readonly expression?: InputSignal<FilterExpression | undefined>;
  readonly disabled?: InputSignal<boolean>;
}
