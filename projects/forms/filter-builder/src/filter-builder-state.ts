import { computed, signal, type Signal, type WritableSignal } from '@angular/core';

import type {
  FilterExpression,
  FilterFieldDef,
  FilterGroup,
  FilterLogic,
  FilterNode,
} from './filter-builder.types';
import {
  appendAtPath,
  filterTreeEqual,
  getNodeAtPath,
  removeAtPath,
  updateAtPath,
} from './filter-builder.utils';

/**
 * Plain-TS state factory for `<cngx-filter-builder>`. Wraps a single
 * writable signal as the canonical tree source-of-truth, derives
 * read-only signals (`tree`, `fieldMap`, `isEmpty`, `expressionCount`),
 * exposes path-keyed mutators, and emits a structural `lastMutation`
 * event slot the presenter watches to drive announcements. No
 * `inject()` calls — the factory is testable without `TestBed` and
 * decompose-safe per `reference_atomic_decompose` rule 4 (DI
 * Abstraction).
 *
 * Two-way binding contract — pass the presenter's
 * `model<FilterGroup>()` as `source`. Mutators write through it, so
 * consumer `[(value)]` bindings emit on every user-initiated change.
 * Uncontrolled callers omit `source`; the factory creates its own
 * `WritableSignal` from `initial ?? EMPTY_ROOT`.
 *
 * Identity & equality — `tree` is wrapped with `equal: filterTreeEqual`
 * so consumer computeds short-circuit on structural equality. Mutators
 * are no-op when the requested write would not change the tree.
 */

/** @internal Shared zero-state used by the presenter's `model<FilterGroup>` default and by `clear()`. */
export const EMPTY_ROOT: FilterGroup = Object.freeze({
  type: 'group',
  logic: 'and',
  negated: false,
  filters: Object.freeze([]),
}) as FilterGroup;

export type FilterMutationKind =
  | 'add-filter'
  | 'remove-filter'
  | 'add-group'
  | 'remove-group'
  | 'set-logic'
  | 'toggle-negated'
  | 'set-field'
  | 'set-operator'
  | 'set-value'
  | 'clear';

export interface FilterMutationContext {
  readonly fieldKey?: string;
  readonly logic?: FilterLogic;
  readonly negated?: boolean;
  readonly operator?: string;
  readonly value?: unknown;
}

export interface FilterMutationEvent {
  readonly kind: FilterMutationKind;
  readonly path: readonly number[];
  readonly context?: FilterMutationContext;
}

export interface CngxFilterBuilderStateOptions<TValue = unknown> {
  readonly source?: WritableSignal<FilterGroup>;
  readonly initial?: FilterGroup;
  readonly fields: Signal<readonly FilterFieldDef<TValue>[]>;
}

export interface CngxFilterBuilderState<TValue = unknown> {
  readonly tree: Signal<FilterGroup>;
  readonly fieldMap: Signal<ReadonlyMap<string, FilterFieldDef<TValue>>>;
  readonly isEmpty: Signal<boolean>;
  readonly expressionCount: Signal<number>;
  readonly lastMutation: Signal<FilterMutationEvent | null>;

  readonly addExpression: (path: readonly number[], expression: FilterExpression) => void;
  readonly addGroup: (path: readonly number[], group: FilterGroup) => void;
  readonly removeNode: (path: readonly number[]) => void;
  readonly setLogic: (path: readonly number[], logic: FilterLogic) => void;
  readonly toggleNegated: (path: readonly number[]) => void;
  readonly setField: (path: readonly number[], fieldKey: string) => void;
  readonly setOperator: (path: readonly number[], operator: string) => void;
  readonly setValue: (path: readonly number[], value: unknown) => void;
  readonly clear: () => void;

  readonly getNodeAtPath: (path: readonly number[]) => FilterNode | null;
  readonly getFieldDef: (fieldKey: string) => FilterFieldDef<TValue> | undefined;
}

function fieldMapEqual<TValue>(
  a: ReadonlyMap<string, FilterFieldDef<TValue>>,
  b: ReadonlyMap<string, FilterFieldDef<TValue>>,
): boolean {
  if (a === b) {
    return true;
  }
  if (a.size !== b.size) {
    return false;
  }
  for (const [key, value] of a) {
    if (b.get(key) !== value) {
      return false;
    }
  }
  return true;
}

function countExpressions(group: FilterGroup): number {
  let count = 0;
  for (const child of group.filters) {
    if (child.type === 'expression') {
      count += 1;
    } else {
      count += countExpressions(child);
    }
  }
  return count;
}

export function createFilterBuilderState<TValue = unknown>(
  opts: CngxFilterBuilderStateOptions<TValue>,
): CngxFilterBuilderState<TValue> {
  const source: WritableSignal<FilterGroup> =
    opts.source ?? signal<FilterGroup>(opts.initial ?? EMPTY_ROOT);

  const lastMutationState: WritableSignal<FilterMutationEvent | null> =
    signal<FilterMutationEvent | null>(null);

  const tree = computed<FilterGroup>(() => source(), { equal: filterTreeEqual });

  const fieldMap = computed<ReadonlyMap<string, FilterFieldDef<TValue>>>(
    () => {
      const map = new Map<string, FilterFieldDef<TValue>>();
      for (const def of opts.fields()) {
        map.set(def.key, def);
      }
      return map;
    },
    { equal: fieldMapEqual<TValue> },
  );

  const isEmpty = computed(() => tree().filters.length === 0);
  const expressionCount = computed(() => countExpressions(tree()));

  function emit(event: FilterMutationEvent): void {
    lastMutationState.set(event);
  }

  function writeIfChanged(next: FilterGroup): boolean {
    if (next === source()) {
      return false;
    }
    source.set(next);
    return true;
  }

  function addExpression(path: readonly number[], expression: FilterExpression): void {
    if (writeIfChanged(appendAtPath(source(), path, expression))) {
      emit({ kind: 'add-filter', path });
    }
  }

  function addGroup(path: readonly number[], group: FilterGroup): void {
    if (writeIfChanged(appendAtPath(source(), path, group))) {
      emit({ kind: 'add-group', path });
    }
  }

  function removeNode(path: readonly number[]): void {
    if (path.length === 0) {
      return;
    }
    const target = getNodeAtPath(source(), path);
    if (!target) {
      return;
    }
    if (writeIfChanged(removeAtPath(source(), path))) {
      emit({
        kind: target.type === 'group' ? 'remove-group' : 'remove-filter',
        path,
      });
    }
  }

  function setLogic(path: readonly number[], logic: FilterLogic): void {
    const updated = updateAtPath(source(), path, (node) => {
      if (node.type !== 'group') {
        return node;
      }
      if (node.logic === logic) {
        return node;
      }
      return { ...node, logic };
    });
    if (writeIfChanged(updated)) {
      emit({ kind: 'set-logic', path, context: { logic } });
    }
  }

  function toggleNegated(path: readonly number[]): void {
    let nextNegated = false;
    const updated = updateAtPath(source(), path, (node) => {
      if (node.type !== 'group') {
        return node;
      }
      nextNegated = !node.negated;
      return { ...node, negated: nextNegated };
    });
    if (writeIfChanged(updated)) {
      emit({ kind: 'toggle-negated', path, context: { negated: nextNegated } });
    }
  }

  function setField(path: readonly number[], fieldKey: string): void {
    const updated = updateAtPath(source(), path, (node) => {
      if (node.type !== 'expression') {
        return node;
      }
      if (node.field === fieldKey) {
        return node;
      }
      return { ...node, field: fieldKey };
    });
    if (writeIfChanged(updated)) {
      emit({ kind: 'set-field', path, context: { fieldKey } });
    }
  }

  function setOperator(path: readonly number[], operator: string): void {
    const updated = updateAtPath(source(), path, (node) => {
      if (node.type !== 'expression') {
        return node;
      }
      if (node.operator === operator) {
        return node;
      }
      return { ...node, operator };
    });
    if (writeIfChanged(updated)) {
      emit({ kind: 'set-operator', path, context: { operator } });
    }
  }

  function setValue(path: readonly number[], value: unknown): void {
    const updated = updateAtPath(source(), path, (node) => {
      if (node.type !== 'expression') {
        return node;
      }
      if (Object.is(node.value, value)) {
        return node;
      }
      return { ...node, value };
    });
    if (writeIfChanged(updated)) {
      emit({ kind: 'set-value', path, context: { value } });
    }
  }

  function clear(): void {
    if (writeIfChanged(EMPTY_ROOT)) {
      emit({ kind: 'clear', path: [] });
    }
  }

  function getNodeAtPathFromTree(path: readonly number[]): FilterNode | null {
    return getNodeAtPath(tree(), path);
  }

  function getFieldDef(fieldKey: string): FilterFieldDef<TValue> | undefined {
    return fieldMap().get(fieldKey);
  }

  return {
    tree,
    fieldMap,
    isEmpty,
    expressionCount,
    lastMutation: lastMutationState.asReadonly(),
    addExpression,
    addGroup,
    removeNode,
    setLogic,
    toggleNegated,
    setField,
    setOperator,
    setValue,
    clear,
    getNodeAtPath: getNodeAtPathFromTree,
    getFieldDef,
  };
}
