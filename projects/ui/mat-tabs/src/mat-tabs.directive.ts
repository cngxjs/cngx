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

import { createMaterialBidirectionalSync } from '@cngx/common/data';
import {
  CNGX_TAB_GROUP_HOST,
  CngxTabGroupPresenter,
  type CngxTabHandle,
} from '@cngx/common/tabs';
import { nextUid } from '@cngx/core/utils';

import { createMatTabHandle } from './material-bridge/handle';

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
  private readonly handlesByTab = new WeakMap<MatTab, CngxTabHandle>();

  constructor() {
    // Register / unregister handles whenever the children query
    // emits. The presenter's `tabsState` carries `tabsEqual` so
    // identity-only re-emissions don't cascade downstream.
    effect(() => {
      const tabs = this.matTabs();
      untracked(() => this.syncHandles(tabs));
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
    const liveIds = new Set<string>();
    tabs.forEach((tab, index) => {
      let handle = this.handlesByTab.get(tab);
      if (!handle) {
        handle = createMatTabHandle(tab, index, () => nextUid('cngx-mat-tab-'));
        this.handlesByTab.set(tab, handle);
      }
      liveIds.add(handle.id);
      this.presenter.register(handle);
    });
    // Unregister any handle whose tab is no longer in the children
    // set. The WeakMap drops references for GC'd MatTab instances;
    // the presenter side needs an explicit unregister.
    for (const id of this.knownIds()) {
      if (!liveIds.has(id)) {
        this.presenter.unregister(id);
      }
    }
  }

  private knownIds(): readonly string[] {
    return this.presenter.tabs().map((h) => h.id);
  }
}
