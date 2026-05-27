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
 * Per-MatTab registry entry. The child `EnvironmentInjector` scopes
 * the per-tab `_stateChanges` bridge — destroying it fires
 * `takeUntilDestroyed` so the subscription unsubscribes
 * deterministically.
 *
 * @internal
 */
interface CngxMatTabsRegistryEntry {
  readonly setup: CngxMatTabHandleSetup;
  readonly childInjector: EnvironmentInjector;
}

/**
 * Read-mostly contract for the per-tab handle-setup registry.
 * `[cngxMatTabError]` and any future `[cngxMatTab*]` decoration
 * directive injects this with `{ host: true }` to reach the
 * per-handle `errorAggregator` slot without walking the concrete
 * registry class.
 *
 * Return type narrows to `Pick<..., 'errorAggregator'>` so the
 * access path exposes only the per-handle aggregator slot; the
 * rest of the setup stays internal bookkeeping.
 *
 * @category ui/mat-tabs
 */
export interface CngxMatTabsRegistryHost {
  /**
   * Returns the per-handle `errorAggregator` slot, or `undefined`
   * before the tab is registered. The `contentChildren(MatTab)`
   * query lands during content-init, so a same-microtask injection
   * from an attribute directive can race; consumers recover by
   * tracking `presenter.tabs()` and re-attempting on the next sync
   * tick.
   */
  getHandleSetup(
    matTab: MatTab,
  ): Pick<CngxMatTabHandleSetup, 'errorAggregator'> | undefined;
}

/**
 * DI token the {@link CngxMatTabsRegistry} directive provides via
 * `useExisting`. Sibling per-tab directives inject this with
 * `{ host: true }` to reach per-handle slots without walking the
 * concrete registry class.
 *
 * @category ui/mat-tabs
 */
export const CNGX_MAT_TABS_REGISTRY_HOST =
  new InjectionToken<CngxMatTabsRegistryHost>('CngxMatTabsRegistryHost');

/**
 * Sibling host-directive that owns the per-MatTab handle registry
 * for `[cngxMatTabs]`. Keeps the parent under the level-4 organism
 * LOC guard and lets per-tab decoration directives reach the
 * registry through a typed token.
 *
 * Owns: `contentChildren(MatTab)` query, the `setupsByTab` map
 * (per-tab cngx setup paired with a child `EnvironmentInjector`
 * scoping the `_stateChanges` bridge), an `effect()` that diffs the
 * MatTab list and (un)registers handles with `CNGX_TAB_GROUP_HOST`,
 * and a `DestroyRef` cleanup that destroys every child injector.
 *
 * Composition: `[cngxMatTabs]` declares this in `hostDirectives`;
 * both share the parent's `CngxTabGroupPresenter` and the same
 * `<mat-tab-group>` content-children scope.
 *
 * @category ui/mat-tabs
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
      // Per-tab child injector scopes the `toSignal(_stateChanges)`
      // bridge inside createMatTabHandle — destroying it on tab
      // removal fires `takeUntilDestroyed`.
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
