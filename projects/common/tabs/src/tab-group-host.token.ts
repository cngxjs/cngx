import { InjectionToken, type ModelSignal, type Signal } from '@angular/core';

import type { CngxAsyncState } from '@cngx/core/utils';

import type { CngxErrorAggregatorContract } from '@cngx/common/interactive';

/**
 * Registration handle a `CngxTab` atom passes to its presenter via
 * {@link CngxTabGroupHost.register}. The handle exposes the atom's
 * reactive fields by reference; the presenter never copies them, so
 * subsequent input changes propagate without re-registration.
 *
 * `errorAggregator` is intentionally a `Signal<...>` slot rather than
 * a static handle — consumer-supplied aggregators may be created
 * per-instance via `viewChild` queries that resolve after the first
 * registration.
 *
 * @category interactive
 */
export interface CngxTabHandle {
  readonly id: string;
  readonly label: Signal<string | undefined>;
  readonly disabled: Signal<boolean>;
  readonly errorAggregator: Signal<CngxErrorAggregatorContract | undefined>;
}

/**
 * Public contract atoms see when they inject the presenter via
 * {@link CNGX_TAB_GROUP_HOST}. Mirrors the directive's surface 1:1
 * so atoms never reach into the concrete class — keeps the layer
 * cycle-free and the decompose schematic happy.
 *
 * @category interactive
 */
export interface CngxTabGroupHost {
  readonly tabs: Signal<readonly CngxTabHandle[]>;
  readonly activeIndex: ModelSignal<number>;
  readonly activeId: Signal<string | null>;
  readonly orientation: Signal<'horizontal' | 'vertical'>;
  readonly loop: Signal<boolean>;
  readonly commitState: CngxAsyncState<number | undefined>;
  readonly intendedIndex: Signal<number | undefined>;

  register(handle: CngxTabHandle): void;
  unregister(id: string): void;

  select(index: number): void;
  selectNext(): void;
  selectPrevious(): void;
  selectById(id: string): void;
}

/**
 * DI token providing the tab presenter's contract to atoms +
 * organism shells + the overflow molecule. The presenter provides
 * this via `useExisting`; `CngxTab` injects it to register; the
 * Level-4 organism injects it to forward keyboard nav from
 * `CngxRovingTabindex`.
 *
 * @category interactive
 */
export const CNGX_TAB_GROUP_HOST = new InjectionToken<CngxTabGroupHost>(
  'CngxTabGroupHost',
);
