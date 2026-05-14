import {
  computed,
  Directive,
  inject,
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
import { type CngxFormFieldControl } from '@cngx/forms/field';

import type {
  FilterExpression,
  FilterFieldDef,
  FilterGroup,
  FilterLogic,
  FilterNode,
} from './filter-builder.types';
import { injectFilterBuilderConfig } from './filter-builder.config';
import {
  CNGX_FILTER_BUILDER_HOST,
  type CngxFilterBuilderHost,
} from './filter-builder-host.token';
import { EMPTY_ROOT } from './filter-builder.helpers';
import {
  CNGX_FILTER_BUILDER_STATE_FACTORY,
  type CngxFilterBuilderState,
} from './filter-builder-state';
import { injectFilterBuilderAnnouncerFactory } from './filter-builder-announcer';

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
  private readonly config = injectFilterBuilderConfig();

  private readonly stateFactory = inject(CNGX_FILTER_BUILDER_STATE_FACTORY);

  private readonly core: CngxFilterBuilderState<TValue> = this.stateFactory<TValue>({
    source: this.value,
    fields: this.fields,
  });

  readonly tree = this.core.tree;
  readonly fieldMap = this.core.fieldMap;
  readonly lastMutation = this.core.lastMutation;
  readonly isEmpty = this.core.isEmpty;

  /**
   * Live-region announcement text. Built via the swappable
   * `CNGX_FILTER_BUILDER_ANNOUNCER_FACTORY` token — consumers override
   * the factory for locale, telemetry, or test doubles without touching
   * the presenter. Default formatter resolves `fieldKey` through `fieldMap`
   * to surface human-readable labels.
   */
  private readonly announcerFactory = injectFilterBuilderAnnouncerFactory();
  private readonly announcer = this.announcerFactory<TValue>({
    lastMutation: this.lastMutation,
    fieldMap: this.fieldMap,
    i18n: this.config.i18n,
  });
  readonly announcement: Signal<string> = this.announcer.announcement;

  readonly id: Signal<string> = signal(nextUid('cngx-filter-builder-')).asReadonly();
  readonly empty: Signal<boolean> = this.core.isEmpty;
  // @todo(phase-6) wire to the underlying field's disabled state via CngxFormFieldPresenter
  readonly disabled: Signal<boolean> = signal(false).asReadonly();
  // @todo(phase-6) drive from focusin/focusout host bindings or the first incomplete expression's focus state
  readonly focused: Signal<boolean> = signal(false).asReadonly();
  /**
   * `true` when at least one expression in the tree has an empty value
   * (`null`, `undefined`, or empty string). Pure intrinsic-validity
   * derivation; `touched` coupling deferred per accepted-debt §12.
   */
  readonly errorState: Signal<boolean> = computed(() =>
    countIncompleteExpressions(this.tree()) > 0,
  );

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

function isExpressionIncomplete(expression: FilterExpression): boolean {
  const value = expression.value;
  return value === null || value === undefined || value === '';
}

function countIncompleteExpressions(group: FilterGroup): number {
  let count = 0;
  for (const child of group.filters) {
    if (child.type === 'expression') {
      if (isExpressionIncomplete(child)) {
        count += 1;
      }
    } else {
      count += countIncompleteExpressions(child);
    }
  }
  return count;
}
