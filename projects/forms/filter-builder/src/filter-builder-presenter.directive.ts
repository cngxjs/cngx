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
import { CNGX_FORM_FIELD_CONTROL, type CngxFormFieldControl } from '@cngx/forms/field';

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

function renderValueForAnnouncement(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    return `"${value}"`;
  }
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  return '';
}

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
  readonly expressionCount = this.core.expressionCount;

  /**
   * Live-region announcement text. Phase 5 ships a synchronous formatter
   * driven directly from `lastMutation` + `fieldMap`; Phase 6 lifts the
   * formatter into a swappable factory token (`CNGX_FILTER_BUILDER_ANNOUNCER_FACTORY`)
   * with i18n hooks. Format strings stay stable across the migration.
   */
  readonly announcement: Signal<string> = computed(() => {
    const event = this.lastMutation();
    if (!event) {
      return '';
    }
    const ctx = event.context;
    const i18n = this.config.i18n;
    switch (event.kind) {
      case 'add-filter': {
        const label = ctx?.fieldKey ?? '';
        return `Filter added: ${label}`;
      }
      case 'remove-filter': {
        const field = ctx?.fieldKey ?? '';
        const op = ctx?.operator ?? '';
        const value = ctx?.value;
        const rendered = renderValueForAnnouncement(value);
        return `Filter removed: ${field} ${op} ${rendered}`.trim();
      }
      case 'add-group':
        return `${i18n.addGroup} added`;
      case 'remove-group':
        return `${i18n.removeGroup}d`;
      case 'set-logic':
        return `Logic changed to ${ctx?.logic?.toUpperCase() ?? ''}`;
      case 'toggle-negated':
        return ctx?.negated ? 'Group negated' : 'Group un-negated';
      case 'set-field':
        return `Field changed to ${ctx?.fieldKey ?? ''}`;
      case 'set-operator':
        return `Operator changed to ${ctx?.operator ?? ''}`;
      case 'set-value':
        return 'Value changed';
      case 'clear':
        return 'Filters cleared';
      default:
        return '';
    }
  });

  readonly id: Signal<string> = signal(nextUid('cngx-filter-builder-')).asReadonly();
  readonly empty: Signal<boolean> = this.core.isEmpty;
  // @todo(phase-6) wire to the underlying field's disabled state via CngxFormFieldPresenter
  readonly disabled: Signal<boolean> = signal(false);
  // @todo(phase-6) drive from focusin/focusout host bindings or the first incomplete expression's focus state
  readonly focused: Signal<boolean> = signal(false);
  // @todo(phase-6) derive from `core.expressionCount` of incomplete expressions + the field's touched flag
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
