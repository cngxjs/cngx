import { InjectionToken, type Signal } from '@angular/core';

import type {
  FilterExpression,
  FilterFieldDef,
  FilterGroup,
  FilterLogic,
  FilterNode,
} from './filter-builder.types';
import type { FilterMutationEvent } from './filter-builder-state';

/**
 * Narrow contract the recursive context atoms ({@link import('./filter-builder-group.directive').CngxFilterGroup} and
 * {@link import('./filter-builder-expression.directive').CngxFilterExpression}) and the atomic-decompose eject path
 * need from the presenter. Decouples them from the concrete
 * `CngxFilterBuilderPresenter` class so the schematic can eject the
 * brain independently of the skin per `reference_atomic_decompose`
 * rule 4 (DI Abstraction).
 *
 * @internal The token has no library default; the presenter directive
 * provides itself via `useExisting: CngxFilterBuilderPresenter`.
 * Consumers do not inject the token directly.
 */
export interface CngxFilterBuilderHost<TValue = unknown> {
  readonly tree: Signal<FilterGroup>;
  readonly fields: Signal<readonly FilterFieldDef<TValue>[]>;
  readonly fieldMap: Signal<ReadonlyMap<string, FilterFieldDef<TValue>>>;
  readonly isEmpty: Signal<boolean>;
  readonly lastMutation: Signal<FilterMutationEvent | null>;

  addExpression(path: readonly number[], expression: FilterExpression): void;
  addGroup(path: readonly number[], group: FilterGroup): void;
  removeNode(path: readonly number[]): void;
  setLogic(path: readonly number[], logic: FilterLogic): void;
  toggleNegated(path: readonly number[]): void;
  setField(path: readonly number[], fieldKey: string): void;
  setOperator(path: readonly number[], operator: string): void;
  setValue(path: readonly number[], value: unknown): void;

  /**
   * Resolve a node at `path` against the current `tree()`. Reads `tree()`
   * internally, so callers inside a reactive context (component template,
   * `computed()`, `effect()`) auto-track tree mutations — no explicit
   * `tree()` read needed. The method shape is non-Signal so call-sites
   * read naturally as `host.getNodeAtPath(path)` rather than
   * `host.getNodeAtPath(path)()`.
   */
  getNodeAtPath(path: readonly number[]): FilterNode | null;

  /**
   * Resolve a field definition by key against the current `fieldMap()`.
   * Same reactive-auto-track contract as {@link getNodeAtPath} — reads
   * the underlying signal internally.
   */
  getFieldDef(fieldKey: string): FilterFieldDef<TValue> | undefined;
}

/** @internal */
export const CNGX_FILTER_BUILDER_HOST = new InjectionToken<CngxFilterBuilderHost>(
  'CNGX_FILTER_BUILDER_HOST',
);
