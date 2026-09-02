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
import { MatTab, MatTabGroup } from '@angular/material/tabs';

import { CNGX_TAB_GROUP_HOST, type CngxTabGroupHost } from '@cngx/common/tabs';
import { nextUid } from '@cngx/core/utils';

import { createOrderedRegistrationSeam } from './material-bridge/ordered-registration';
import { CNGX_MAT_TAB_HANDLE_FACTORY, type CngxMatTabHandleSetup } from './material-bridge/handle';
import type { MaterialPrivateSurfaces } from './material-bridge/private-surfaces';

/**
 * Per-MatTab registry entry. The child `EnvironmentInjector` scopes
 * the per-tab `_stateChanges` bridge - destroying it fires
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
   * Returns the per-handle writable slots (`errorAggregator`,
   * `directError`), or `undefined` before the tab is registered. The
   * `contentChildren(MatTab)` query lands during content-init, so a
   * same-microtask injection from an attribute directive can race;
   * consumers recover by tracking `presenter.tabs()` and re-attempting
   * on the next sync tick.
   */
  getHandleSetup(
    matTab: MatTab,
  ): Pick<CngxMatTabHandleSetup, 'errorAggregator' | 'directError'> | undefined;
}

/**
 * DI token the {@link CngxMatTabsRegistry} directive provides via
 * `useExisting`. Sibling per-tab directives inject this with
 * `{ host: true }` to reach per-handle slots without walking the
 * concrete registry class.
 *
 * @category ui/mat-tabs
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/mat-tabs/mat-tabs-registry.directive.ts
 * @since 0.1.0
 */
export const CNGX_MAT_TABS_REGISTRY_HOST = new InjectionToken<CngxMatTabsRegistryHost>(
  'CngxMatTabsRegistryHost',
);

/**
 * Sibling host-directive that owns the per-MatTab handle registry
 * for `[cngxMatTabs]`. Keeps the parent under the level-4 organism
 * LOC guard and lets per-tab decoration directives reach the
 * registry through a typed token.
 *
 * Owns: `contentChildren(MatTab)` query, the order-aware
 * registration seam (per-tab cngx setup paired with a child
 * `EnvironmentInjector` scoping the `_stateChanges` bridge), an
 * `effect()` that mirrors the MatTab query order into
 * `CNGX_TAB_GROUP_HOST` on every emission, and a `DestroyRef`
 * cleanup that unregisters and destroys every entry.
 *
 * Order matters: the presenter registry appends new registrations,
 * but Material renders tabs at their DOM position - a mid-list
 * `<mat-tab>` insert must land at its query index, not at the tail,
 * or index-based selection, announcements and decorations target the
 * wrong tab. The shared seam re-registers the diverging suffix in
 * query order while keeping surviving handle instances (and their
 * child injectors) alive.
 *
 * Composition: `[cngxMatTabs]` declares this in `hostDirectives`;
 * both share the parent's `CngxTabGroupPresenter` and the same
 * `<mat-tab-group>` content-children scope.
 *
 * @category ui/mat-tabs
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/mat-tabs/mat-tabs-registry.directive.ts
 * @since 0.1.0
 * @relatedTo CngxMatTabs, CngxMatTabError, CNGX_MAT_TABS_REGISTRY_HOST
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
  private readonly matTabGroup = inject(MatTabGroup, { self: true });

  private readonly matTabs = contentChildren(MatTab, { descendants: true });

  private readonly seam = createOrderedRegistrationSeam<MatTab, CngxMatTabsRegistryEntry>({
    create: (tab) => {
      // Per-tab child injector scopes the `toSignal(_stateChanges)`
      // bridge inside createMatTabHandle - destroying it on tab
      // removal fires `takeUntilDestroyed`.
      const childInjector = createEnvironmentInjector([], this.envInjector);
      const idSeed = () => nextUid('cngx-mat-tab-');
      const setup = this.createHandle(tab, idSeed, childInjector);
      return { setup, childInjector };
    },
    register: (entry) => this.presenter.register(entry.setup.handle),
    unregister: (entry) => this.presenter.unregister(entry.setup.handle.id, entry.setup.handle),
    dispose: (entry) => entry.childInjector.destroy(),
  });

  constructor() {
    effect(() => {
      // Ownership filter: `descendants: true` also surfaces MatTabs of
      // a tab-group nested inside one of OUR tabs' content. Each MatTab
      // carries its owning `_closestTabGroup` (see
      // MaterialPrivateSurfaces.ClosestTabGroupSource), so foreign tabs
      // are dropped before they can register with this presenter -
      // mirrors the mat-stepper/mat-accordion sibling filters.
      const tabs = this.matTabs().filter(
        (tab) =>
          (tab as unknown as MaterialPrivateSurfaces.ClosestTabGroupSource)._closestTabGroup ===
          this.matTabGroup,
      );
      untracked(() => this.seam.sync(tabs));
    });

    this.destroyRef.onDestroy(() => this.seam.clear());
  }

  getHandleSetup(
    matTab: MatTab,
  ): Pick<CngxMatTabHandleSetup, 'errorAggregator' | 'directError'> | undefined {
    return this.seam.get(matTab)?.setup;
  }
}
