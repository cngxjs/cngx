import type { InputSignal, ModelSignal } from '@angular/core';

import type { FilterExpression, FilterFieldDef } from './filter-builder.types';

/**
 * Contract every consumer-supplied custom editor component must satisfy
 * when registered against {@link CNGX_FILTER_EDITORS}.
 *
 * Shape mirrors Angular 21 Signal Forms' `FormValueControl<T>`: the
 * required `value` is a `ModelSignal` so two-way binding wires through
 * `[(value)]` without a `ControlValueAccessor`. The optional `fieldDef`,
 * `expression`, and `disabled` inputs are projected by the filter-builder
 * row when the editor is mounted; consumers declare only the inputs they
 * care about - undeclared inputs are skipped, never an error.
 *
 * How projection works: the rows mount registered component editors
 * through `CngxFilterValueEditorHost` (`ViewContainerRef.createComponent`
 * + `setInput`), which pushes the current expression value into `value`
 * and reads editor-originated `value` changes back into the row's write
 * sink - `value.set(...)` inside the editor lands in the filter tree.
 *
 * Echo-guard semantics: both sync directions are guarded by a value
 * equality (`arrayEqual` when both sides are arrays - fresh `[min, max]`
 * / list references must not loop - `Object.is` otherwise, overridable
 * via the host's `valueEquals` input), so a pushed value never re-enters
 * the sink and a written-back value never re-pushes.
 *
 * `disabled` sourcing: projected from the mounting surface's disabled
 * state. The builder's expression row projects the builder disabled state
 * (and the row's `setValue` sink is a no-op meanwhile); the standalone
 * `CngxFilterRow` has no disabled state and mounts editors enabled.
 */
export interface CngxFilterEditorComponent<TValue> {
  readonly value: ModelSignal<TValue | null>;
  readonly fieldDef?: InputSignal<FilterFieldDef | undefined>;
  readonly expression?: InputSignal<FilterExpression | undefined>;
  readonly disabled?: InputSignal<boolean>;
}
