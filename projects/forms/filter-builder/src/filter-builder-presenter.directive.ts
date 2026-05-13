import {
  Directive,
  input,
  model,
  signal,
  type Signal,
} from '@angular/core';
import { createManualState } from '@cngx/common/data';
import {
  CNGX_STATEFUL,
  type CngxAsyncState,
  type CngxStateful,
  nextUid,
} from '@cngx/core/utils';
import { CNGX_FORM_FIELD_CONTROL, type CngxFormFieldControl } from '@cngx/forms/field';

import type {
  FilterExpression,
  FilterFieldDef,
  FilterGroup,
  FilterLogic,
  FilterNode,
} from './filter-builder.types';
import {
  CNGX_FILTER_BUILDER_HOST,
  type CngxFilterBuilderHost,
} from './filter-builder-host.token';
import {
  createFilterBuilderState,
  type CngxFilterBuilderState,
} from './filter-builder-state';

const EMPTY_ROOT: FilterGroup = { type: 'group', logic: 'and', negated: false, filters: [] };

/**
 * Thin presenter directive. Instantiates `createFilterBuilderState` against
 * its own `model<FilterGroup>` so two-way `[(value)]` binding writes through
 * mutators. Provides three tokens via `useExisting` so the recursive
 * context atoms, transition bridges, and `cngx-form-field` host all bind
 * against one source of truth.
 *
 * The `CngxFormFieldControl` surface ships minimal scalars here
 * (id/empty/disabled/focused/errorState); Phase 6 wires error derivation,
 * focus delegation, and reactive-required against the field's
 * validator graph.
 */
@Directive({
  selector: '[cngxFilterBuilderPresenter]',
  exportAs: 'cngxFilterBuilder',
  standalone: true,
  providers: [
    { provide: CNGX_FILTER_BUILDER_HOST, useExisting: CngxFilterBuilderPresenter },
    { provide: CNGX_STATEFUL, useExisting: CngxFilterBuilderPresenter },
    { provide: CNGX_FORM_FIELD_CONTROL, useExisting: CngxFilterBuilderPresenter },
  ],
})
export class CngxFilterBuilderPresenter<TValue = unknown>
  implements
    CngxFilterBuilderHost<TValue>,
    CngxStateful<unknown>,
    CngxFormFieldControl
{
  readonly fields = input.required<readonly FilterFieldDef<TValue>[]>();

  readonly value = model<FilterGroup>(EMPTY_ROOT);

  readonly stateInput = input<
    CngxAsyncState<unknown> | undefined,
    CngxAsyncState<unknown> | '' | undefined
  >(undefined, {
    alias: 'cngxFilterBuilderState',
    transform: (v): CngxAsyncState<unknown> | undefined =>
      typeof v === 'string' ? undefined : v,
  });

  private readonly idleState: CngxAsyncState<unknown> = createManualState<unknown>();

  /** @internal Always-on fallback used when the host needs an instance for tests. */
  private readonly core: CngxFilterBuilderState<TValue> = createFilterBuilderState<TValue>({
    source: this.value,
    fields: this.fields,
  });

  readonly tree = this.core.tree;
  readonly fieldMap = this.core.fieldMap;
  readonly lastMutation = this.core.lastMutation;
  readonly isEmpty = this.core.isEmpty;
  readonly expressionCount = this.core.expressionCount;

  readonly id: Signal<string> = signal(nextUid('cngx-filter-builder-'));
  readonly empty: Signal<boolean> = this.core.isEmpty;
  readonly disabled: Signal<boolean> = signal(false);
  readonly focused: Signal<boolean> = signal(false);
  readonly errorState: Signal<boolean> = signal(false);

  /** Implements `CngxStateful.state` — forwards `[cngxFilterBuilderState]` when bound, else an idle slot. */
  get state(): CngxAsyncState<unknown> {
    return this.stateInput() ?? this.idleState;
  }

  addExpression(path: readonly number[], expression: FilterExpression): void {
    this.core.addExpression(path, expression);
  }

  addGroup(path: readonly number[], group: FilterGroup): void {
    this.core.addGroup(path, group);
  }

  removeNode(path: readonly number[]): void {
    this.core.removeNode(path);
  }

  setLogic(path: readonly number[], logic: FilterLogic): void {
    this.core.setLogic(path, logic);
  }

  toggleNegated(path: readonly number[]): void {
    this.core.toggleNegated(path);
  }

  setField(path: readonly number[], fieldKey: string): void {
    this.core.setField(path, fieldKey);
  }

  setOperator(path: readonly number[], operator: string): void {
    this.core.setOperator(path, operator);
  }

  setValue(path: readonly number[], value: unknown): void {
    this.core.setValue(path, value);
  }

  getNodeAtPath(path: readonly number[]): FilterNode | null {
    return this.core.getNodeAtPath(path);
  }

  getFieldDef(fieldKey: string): FilterFieldDef<TValue> | undefined {
    return this.core.getFieldDef(fieldKey);
  }
}
