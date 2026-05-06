import {
  contentChildren,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  Injector,
  Renderer2,
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
  private readonly renderer = inject(Renderer2);
  private readonly hostEl =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  private readonly matTabs = contentChildren(MatTab, { descendants: true });
  // Per-tab registries — strong refs are bounded by the directive's
  // lifetime (every entry is explicitly deleted when the matching
  // MatTab leaves the children set, AND the maps go away on
  // directive destroy). Map (not WeakMap) so the diff loop in
  // `syncHandles` can iterate to find removed tabs without a
  // parallel `Set<MatTab>`.
  private readonly setupsByTab = new Map<MatTab, CngxMatTabHandleSetup>();
  private readonly stateChangeSubsByTab = new Map<MatTab, Subscription>();

  // Tracks the currently-decorated MatTab element so the next
  // decoration cycle can clean its prior class + aria-invalid before
  // applying the new one. Material owns the elements; we own only
  // our additive class and attribute. Persists across effect runs;
  // cleared on directive destroy.
  private decoratedEl: HTMLElement | null = null;

  constructor() {
    effect(() => {
      const tabs = this.matTabs();
      untracked(() => this.syncHandles(tabs));
    });

    // Persistent rejection decoration (Pillar 2 — Kommunikation als
    // First-Class Concern) projected onto the matching <mat-tab>
    // element via Renderer2. The effect derives the decoration target
    // from a single source signal (`presenter.lastFailedIndex`); the
    // registry walk + DOM mutation run inside `untracked()` so the
    // dependency graph stays flat — only `lastFailedIndex` and
    // `tabs()` (read at the top) are tracked. Sanctioned `effect()`
    // + `Renderer2` pattern per `reference_signal_architecture` hook
    // matrix: signal projection onto DOM is a side-effect, not a
    // derivation. Material consumers gain the persistent error visual
    // + standard `aria-invalid="true"` ARIA without touching their
    // <mat-tab> templates.
    effect(() => {
      const failedIdx = this.presenter.lastFailedIndex();
      const tabs = this.presenter.tabs();
      untracked(() => this.applyRejectionDecoration(failedIdx, tabs));
    });

    this.destroyRef.onDestroy(() => {
      for (const sub of this.stateChangeSubsByTab.values()) {
        sub.unsubscribe();
      }
      this.stateChangeSubsByTab.clear();
      this.setupsByTab.clear();
      this.clearDecoration();
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
    // children-set is gone — unsubscribe + unregister. Snapshot
    // entries before the loop so multi-key deletes inside the body
    // never collide with iterator state (current-key delete is
    // spec-safe; the snapshot is defensive against future-edit
    // regressions that introduce non-current-key deletes).
    for (const [tab, setup] of Array.from(this.setupsByTab.entries())) {
      if (liveTabs.has(tab)) {
        continue;
      }
      this.stateChangeSubsByTab.get(tab)?.unsubscribe();
      this.stateChangeSubsByTab.delete(tab);
      this.setupsByTab.delete(tab);
      this.presenter.unregister(setup.handle.id);
    }
  }

  private applyRejectionDecoration(
    failedIdx: number | undefined,
    tabs: readonly { readonly id: string }[],
  ): void {
    // Clear any prior decoration first — keeps the contract that
    // `cngx-mat-tab--error` lives on at most one element at any time
    // (matches the presenter's single-slot `lastFailedIndex` shape).
    this.clearDecoration();

    if (failedIdx === undefined || !tabs[failedIdx]) {
      return;
    }
    // Material renders the clickable tab buttons inside `MatTabHeader`
    // (NOT on each `<mat-tab>` declaration — `MatTab.elementRef` is
    // not part of the public API). The buttons land in declaration
    // order, which matches the presenter's `tabs()` array order
    // (registration follows `contentChildren(MatTab)` order which
    // follows declaration order). Indexing `.mat-mdc-tab` by
    // `failedIdx` is the only viable way to reach the rendered DOM
    // element. Index drift on dynamic tab removal is the same risk
    // the cngx-native variant carries via `[class.X]="failedIdx === i"`
    // — accepted (Pillar 1: index-driven binding is idempotent on
    // re-render).
    const buttons = this.hostEl.querySelectorAll<HTMLElement>('.mat-mdc-tab');
    const targetEl = buttons.item(failedIdx);
    if (!targetEl) {
      return;
    }
    this.renderer.addClass(targetEl, 'cngx-mat-tab--error');
    this.renderer.setAttribute(targetEl, 'aria-invalid', 'true');
    this.decoratedEl = targetEl;
  }

  private clearDecoration(): void {
    if (!this.decoratedEl) {
      return;
    }
    this.renderer.removeClass(this.decoratedEl, 'cngx-mat-tab--error');
    this.renderer.removeAttribute(this.decoratedEl, 'aria-invalid');
    this.decoratedEl = null;
  }

  /**
   * Clear the persisted `lastFailedIndex` rejection flag on the
   * presenter — public delegator mirroring the
   * {@link https://cngx.dev/api/CngxTabGroup#clearLastFailed
   * `CngxTabGroup.clearLastFailed()`} pattern so consumers using a
   * template ref (`#mt="cngxMatTabs"`) can dismiss the rejection
   * decoration programmatically without injecting the host token.
   */
  clearLastFailed(): void {
    this.presenter.clearLastFailed();
  }
}
