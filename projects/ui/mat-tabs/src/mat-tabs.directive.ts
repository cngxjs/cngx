import {
  contentChildren,
  DestroyRef,
  Directive,
  effect,
  inject,
  Injector,
  untracked,
} from '@angular/core';
import { MatTab, MatTabGroup } from '@angular/material/tabs';
import type { Subscription } from 'rxjs';

import { createMaterialBidirectionalSync } from '@cngx/common/data';
import {
  CNGX_TAB_GROUP_HOST,
  CngxTabGroupPresenter,
} from '@cngx/common/tabs';
import { nextUid } from '@cngx/core/utils';

import {
  createMatTabHandle,
  type CngxMatTabHandleSetup,
} from './material-bridge/handle';

/**
 * Material instrumentation directive — attaches to an existing
 * `<mat-tab-group>` and bridges it against a cngx
 * {@link CngxTabGroupPresenter} so consumers gain commit-action
 * lifecycle, `CNGX_STATEFUL` provision (and therefore `<cngx-toast-on />`
 * / `<cngx-banner-on />` composition), and the cngx tab-handle
 * registry — without rewriting their template. One attribute upgrade.
 *
 * Topology is the inverse of the `<cngx-mat-stepper>` thin-wrapper:
 * Material is the host, cngx is the instrumentation layer.
 * `inject(MatTabGroup, { self: true })` resolves directly off the
 * consumer's element. No content projection, no DI ordering issue —
 * `stepper-accepted-debt §1`'s structural blocker on the **adoption**
 * direction does not apply here.
 *
 * @category interactive
 */
@Directive({
  selector: '[cngxMatTabs]',
  exportAs: 'cngxMatTabs',
  standalone: true,
  hostDirectives: [
    {
      directive: CngxTabGroupPresenter,
      inputs: ['activeIndex', 'orientation', 'loop', 'commitAction', 'commitMode'],
      outputs: ['activeIndexChange'],
    },
  ],
})
export class CngxMatTabs {
  private readonly matTabGroup = inject(MatTabGroup, { self: true });
  private readonly presenter = inject(CNGX_TAB_GROUP_HOST);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  private readonly matTabs = contentChildren(MatTab, { descendants: true });
  private readonly setupsByTab = new WeakMap<MatTab, CngxMatTabHandleSetup>();
  private stateChangeSubs: Subscription[] = [];

  constructor() {
    // Sync handles + (re)subscribe to each live MatTab's
    // `_stateChanges`. The subscription set is rebuilt on every
    // children-set emission so removed MatTabs drop their
    // subscription cleanly; cached setups in the WeakMap survive,
    // so handle ids stay stable across re-emissions of the same
    // MatTab instance.
    effect(() => {
      const tabs = this.matTabs();
      untracked(() => this.syncHandles(tabs));
    });

    this.destroyRef.onDestroy(() => {
      this.stateChangeSubs.forEach((s) => s.unsubscribe());
      this.stateChangeSubs = [];
    });

    createMaterialBidirectionalSync({
      presenterIndex: this.presenter.activeIndex,
      readSelectedIndex: () => this.matTabGroup.selectedIndex ?? 0,
      writeSelectedIndex: (i) => {
        this.matTabGroup.selectedIndex = i;
      },
      selectionChange$: this.matTabGroup.selectedIndexChange.asObservable(),
      onMaterialSelection: (i) => this.presenter.select(i),
      injector: this.injector,
      destroyRef: this.destroyRef,
    });
  }

  private syncHandles(tabs: readonly MatTab[]): void {
    // Tear down state-change subs before rebuilding — closures hold
    // strong refs to MatTab instances, so subs from removed tabs
    // would leak otherwise.
    this.stateChangeSubs.forEach((s) => s.unsubscribe());
    this.stateChangeSubs = [];

    const liveIds = new Set<string>();
    for (const tab of tabs) {
      let setup = this.setupsByTab.get(tab);
      if (!setup) {
        setup = createMatTabHandle(tab, () => nextUid('cngx-mat-tab-'));
        this.setupsByTab.set(tab, setup);
        // First time we see this MatTab — register the handle. On
        // subsequent emissions of the same instance we skip the
        // re-register so the presenter's `tabsState` doesn't churn
        // with identity-only re-emissions.
        this.presenter.register(setup.handle);
      }
      liveIds.add(setup.handle.id);

      // Live projection of MatTab.disabled / textLabel via
      // `_stateChanges`. See `handle.ts` JSDoc for the underscore-
      // prefix coupling note.
      const localSetup = setup;
      this.stateChangeSubs.push(
        tab._stateChanges.subscribe(() => {
          localSetup.label.set(tab.textLabel);
          localSetup.disabled.set(tab.disabled);
        }),
      );
    }

    // Single-pass unregister of stale ids — anything currently in
    // the presenter that's not a live id must have been removed.
    for (const id of this.presenter.tabs().map((h) => h.id)) {
      if (!liveIds.has(id)) {
        this.presenter.unregister(id);
      }
    }
  }
}
