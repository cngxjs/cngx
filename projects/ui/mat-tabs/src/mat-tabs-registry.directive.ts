import {
  contentChildren,
  createEnvironmentInjector,
  DestroyRef,
  Directive,
  effect,
  EnvironmentInjector,
  inject,
  InjectionToken,
  untracked,
} from '@angular/core';
import { MatTab } from '@angular/material/tabs';

import { CNGX_TAB_GROUP_HOST, type CngxTabGroupHost } from '@cngx/common/tabs';
import { nextUid } from '@cngx/core/utils';

import {
  CNGX_MAT_TAB_HANDLE_FACTORY,
  type CngxMatTabHandleSetup,
} from './material-bridge/handle';

/**
 * Per-MatTab registry entry. Pairs the cngx setup with a child
 * `EnvironmentInjector` that scopes the lifetime of the per-tab
 * `tab._stateChanges` bridge — destroying the child injector fires
 * its `DestroyRef`, which `takeUntilDestroyed` listens for so the
 * bridge subscription unsubscribes deterministically.
 *
 * @internal
 */
interface CngxMatTabsRegistryEntry {
  readonly setup: CngxMatTabHandleSetup;
  readonly childInjector: EnvironmentInjector;
}

/**
 * Read-mostly contract for the per-tab handle-setup registry. The
 * shape `[cngxMatTabError]` and any future `[cngxMatTab*]` per-tab
 * decoration directive injects to walk back to the per-handle
 * `errorAggregator` writable slot. Sibling per-tab directives reach
 * the registry through this token (`inject(CNGX_MAT_TABS_REGISTRY_HOST,
 * { host: true })`) instead of injecting the concrete
 * {@link CngxMatTabs} class — closes the `tabs-accepted-debt §7`
 * concrete-sibling-injection coupling that the previous registry-
 * inside-`[cngxMatTabs]` shape tolerated.
 *
 * Return type is narrowed to `Pick<CngxMatTabHandleSetup,
 * 'errorAggregator'>` so the access path leaks only the per-handle
 * aggregator slot; the rest of the setup (handle, label, disabled
 * writables) stays internal bookkeeping the registry owns.
 *
 * @category interactive
 */
export interface CngxMatTabsRegistryHost {
  /**
   * Look up the per-handle `errorAggregator` writable slot for a
   * given `MatTab`. Returns `undefined` when the tab has not been
   * registered yet — the registry's `contentChildren(MatTab)` query
   * lands during Angular's content-init pass, so a same-microtask
   * injection from a per-tab attribute directive can race the
   * registration. Race-recovery happens by tracking
   * `presenter.tabs()` in the consumer's effect so a later sync tick
   * re-attempts the lookup.
   */
  getHandleSetup(
    matTab: MatTab,
  ): Pick<CngxMatTabHandleSetup, 'errorAggregator'> | undefined;
}

/**
 * DI token the {@link CngxMatTabsRegistry} directive provides via
 * `useExisting`. Sibling per-tab directives ({@link CngxMatTabError}
 * and any future `[cngxMatTab*]`-shaped slot directive) inject this
 * with `{ host: true }` to reach the per-handle writable slots
 * without walking the concrete registry class.
 *
 * @category interactive
 */
export const CNGX_MAT_TABS_REGISTRY_HOST =
  new InjectionToken<CngxMatTabsRegistryHost>('CngxMatTabsRegistryHost');

/**
 * Sibling host-directive that owns the per-MatTab handle registry
 * for the `[cngxMatTabs]` instrumentation surface. Extracted from
 * `[cngxMatTabs]` (Phase 7.1 of `mat-stepper-mat-tabs-hardening-plan`)
 * so the parent directive's class body stays under the level-4
 * organism LOC guard and so per-tab decoration directives inject the
 * registry surface via a typed token instead of the parent class.
 *
 * Owns:
 * - `contentChildren(MatTab, { descendants: true })` query against
 *   the host element's projected `<mat-tab>` siblings.
 * - `setupsByTab` map keyed by `MatTab` instance, value pairs the
 *   cngx handle setup with a per-tab child `EnvironmentInjector`
 *   that scopes the lifetime of the `toSignal(_stateChanges)` bridge
 *   created inside `createMatTabHandle`.
 * - An `effect()` that diffs the live MatTab list against the map
 *   and registers / unregisters handles with the cngx
 *   `CNGX_TAB_GROUP_HOST` presenter on every content-children change.
 * - A `DestroyRef.onDestroy()` cleanup that destroys every child
 *   injector so the per-tab `_stateChanges` Subject bridges
 *   unsubscribe deterministically.
 *
 * Composition with `[cngxMatTabs]`: the parent directive declares
 * this in its `hostDirectives: [...]` list. Both directives share
 * the same `CNGX_TAB_GROUP_HOST` presenter (provided by the parent's
 * own `CngxTabGroupPresenter` host-directive composition) and the
 * same content-children scope (the wrapping `<mat-tab-group>` host
 * element).
 *
 * Standalone use: also exported from `public-api.ts` so a consumer
 * can place `[cngxMatTabsRegistry]` separately on the same
 * `<mat-tab-group>` if they want to share the registry across
 * multiple decoration directives without binding `[cngxMatTabs]`.
 * Today only `[cngxMatTabs]` ships against the directive — the
 * standalone export is staged surface; see `tabs-accepted-debt §11`
 * for the decompose-pressure framing.
 *
 * @category interactive
 */
@Directive({
  selector: '[cngxMatTabsRegistry]',
  exportAs: 'cngxMatTabsRegistry',
  standalone: true,
  providers: [
    {
      provide: CNGX_MAT_TABS_REGISTRY_HOST,
      useExisting: CngxMatTabsRegistry,
    },
  ],
})
export class CngxMatTabsRegistry implements CngxMatTabsRegistryHost {
  private readonly presenter = inject<CngxTabGroupHost>(CNGX_TAB_GROUP_HOST);
  private readonly destroyRef = inject(DestroyRef);
  private readonly envInjector = inject(EnvironmentInjector);
  private readonly createHandle = inject(CNGX_MAT_TAB_HANDLE_FACTORY);

  private readonly matTabs = contentChildren(MatTab, { descendants: true });
  // Map (not WeakMap) so the diff loop in `syncHandles` can iterate
  // to find removed tabs without a parallel `Set<MatTab>`. Entries
  // are explicitly deleted when the matching MatTab leaves the
  // children set, AND the map goes away on directive destroy.
  private readonly setupsByTab = new Map<MatTab, CngxMatTabsRegistryEntry>();

  constructor() {
    effect(() => {
      const tabs = this.matTabs();
      untracked(() => this.syncHandles(tabs));
    });

    this.destroyRef.onDestroy(() => {
      for (const entry of this.setupsByTab.values()) {
        // Disposes the per-tab `toSignal(_stateChanges)` bridge.
        entry.childInjector.destroy();
      }
      this.setupsByTab.clear();
    });
  }

  getHandleSetup(
    matTab: MatTab,
  ): Pick<CngxMatTabHandleSetup, 'errorAggregator'> | undefined {
    return this.setupsByTab.get(matTab)?.setup;
  }

  private syncHandles(tabs: readonly MatTab[]): void {
    const liveTabs = new Set<MatTab>(tabs);
    for (const tab of tabs) {
      if (this.setupsByTab.has(tab)) {
        continue;
      }
      // Per-tab child `EnvironmentInjector` owns the lifetime of the
      // `toSignal(_stateChanges)` bridge created inside
      // `createMatTabHandle`. Destroying the child injector below
      // when a tab leaves fires the bridge's `takeUntilDestroyed`
      // cleanup so the underlying RxJS subscription unsubscribes
      // deterministically — same per-tab cleanup precision as the
      // prior `Map<MatTab, Subscription>` shape, with the imperative
      // pump replaced by `computed`-derived `label` / `disabled` on
      // the handle. Tracked as `tabs-accepted-debt §5` (Material-
      // private `_stateChanges` coupling).
      const childInjector = createEnvironmentInjector([], this.envInjector);
      const idSeed = () => nextUid('cngx-mat-tab-');
      const setup = this.createHandle(tab, idSeed, childInjector);
      this.setupsByTab.set(tab, { setup, childInjector });
      this.presenter.register(setup.handle);
    }
    // Snapshot entries before the loop so multi-key deletes inside
    // the body never collide with iterator state.
    for (const [tab, entry] of Array.from(this.setupsByTab.entries())) {
      if (liveTabs.has(tab)) {
        continue;
      }
      entry.childInjector.destroy();
      this.setupsByTab.delete(tab);
      this.presenter.unregister(entry.setup.handle.id);
    }
  }
}
