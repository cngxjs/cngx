import { inject, InjectionToken, type Signal } from '@angular/core';
import { CngxRuntimeError } from '@cngx/utils';

import type {
  FilterExpression,
  FilterFieldDef,
  FilterGroup,
  FilterLogic,
  FilterNode,
} from './filter-builder.types';
import type { FilterMutationEvent } from './filter-builder-state';
import type { CngxFilterRowFieldChangePlan } from './filter-builder-row-controller';

/**
 * Narrow contract the recursive context atoms ({@link import('./filter-builder-group.directive').CngxFilterGroup} and
 * {@link import('./filter-builder-expression.directive').CngxFilterExpression}) and the atomic-decompose eject path
 * need from the presenter. Decouples them from the concrete
 * `CngxFilterBuilderPresenter` class so the decompose schematic can eject
 * the brain independently of the skin (DI abstraction).
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
   * Atomic field change: one tree write, one `set-field` mutation event,
   * one announcement per gesture. See
   * {@link import('./filter-builder-state').CngxFilterBuilderState.applyFieldChange}.
   */
  applyFieldChange(path: readonly number[], plan: CngxFilterRowFieldChangePlan): void;

  /**
   * Resolve a node at `path` against the current `tree()`. Reads `tree()`
   * internally, so callers inside a reactive context (component template,
   * `computed()`, `effect()`) auto-track tree mutations - no explicit
   * `tree()` read needed. The method shape is non-Signal so call-sites
   * read naturally as `host.getNodeAtPath(path)` rather than
   * `host.getNodeAtPath(path)()`.
   */
  getNodeAtPath(path: readonly number[]): FilterNode | null;

  /**
   * Resolve a field definition by key against the current `fieldMap()`.
   * Same reactive-auto-track contract as {@link getNodeAtPath} - reads
   * the underlying signal internally.
   */
  getFieldDef(fieldKey: string): FilterFieldDef<TValue> | undefined;
}

/** @internal */
export const CNGX_FILTER_BUILDER_HOST = new InjectionToken<CngxFilterBuilderHost>(
  'CNGX_FILTER_BUILDER_HOST',
);

/**
 * Inject the {@link CNGX_FILTER_BUILDER_HOST} of the surrounding filter
 * builder from a group or expression directive or an expression row.
 * Throws a `CngxRuntimeError` with code `CNGX2014` when no builder presenter
 * is above it, in development and production alike. `selector` names the
 * directive or component in the development message.
 *
 * @internal
 */
export function injectFilterBuilderHost(selector: string): CngxFilterBuilderHost {
  const host = inject(CNGX_FILTER_BUILDER_HOST, { optional: true });
  if (!host) {
    throw new CngxRuntimeError(
      'CNGX2014',
      typeof ngDevMode !== 'undefined' &&
        ngDevMode &&
        `[${selector}] must be placed inside <cngx-filter-builder> or an element with [cngxFilterBuilderPresenter].`,
    );
  }
  return host;
}
