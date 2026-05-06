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
  // Per-tab registries — strong refs are bounded by the directive's
  // lifetime (every entry is explicitly deleted when the matching
  // MatTab leaves the children set, AND the maps go away on
  // directive destroy). Map (not WeakMap) so the diff loop in
  // `syncHandles` can iterate to find removed tabs without a
  // parallel `Set<MatTab>`.
  private readonly setupsByTab = new Map<MatTab, CngxMatTabHandleSetup>();
  private readonly stateChangeSubsByTab = new Map<MatTab, Subscription>();

  constructor() {
    effect(() => {
      const tabs = this.matTabs();
      untracked(() => this.syncHandles(tabs));
    });

    this.destroyRef.onDestroy(() => {
      for (const sub of this.stateChangeSubsByTab.values()) {
        sub.unsubscribe();
      }
      this.stateChangeSubsByTab.clear();
      this.setupsByTab.clear();
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
    const liveTabs = new Set<MatTab>(tabs);

    // Add: only fresh MatTabs get a setup + handle registration +
    // `_stateChanges` subscription. Cached MatTabs survive untouched
    // — no register-churn, no resubscribe-churn.
    for (const tab of tabs) {
      if (this.setupsByTab.has(tab)) {
        continue;
      }
      const setup = createMatTabHandle(tab, () => nextUid('cngx-mat-tab-'));
      this.setupsByTab.set(tab, setup);
      this.presenter.register(setup.handle);
      // Live projection of MatTab.disabled / textLabel via
      // `_stateChanges`. See `handle.ts` JSDoc for the
      // underscore-prefix coupling note.
      const sub = tab._stateChanges.subscribe(() => {
        setup.label.set(tab.textLabel);
        setup.disabled.set(tab.disabled);
      });
      this.stateChangeSubsByTab.set(tab, sub);
    }

    // Remove: any MatTab in our registry that's no longer in the
    // children-set is gone — unsubscribe + unregister. Single pass
    // over our own registry, no walk over the presenter's array.
    for (const [tab, setup] of this.setupsByTab) {
      if (liveTabs.has(tab)) {
        continue;
      }
      this.stateChangeSubsByTab.get(tab)?.unsubscribe();
      this.stateChangeSubsByTab.delete(tab);
      this.setupsByTab.delete(tab);
      this.presenter.unregister(setup.handle.id);
    }
  }
}
