import {
  computed,
  Directive,
  inject,
  input,
  model,
  signal,
  type Signal,
} from '@angular/core';

import {
  CNGX_COMMIT_CONTROLLER_FACTORY,
  type CngxCommitController,
} from '@cngx/common/data';
import { CNGX_STATEFUL, type CngxAsyncState } from '@cngx/core/utils';
import type { Observable } from 'rxjs';

import {
  CNGX_TABS_COMMIT_HANDLER_FACTORY,
  type CngxTabsCommitHandler,
} from './commit-handler';
import {
  CNGX_TAB_GROUP_HOST,
  type CngxTabGroupHost,
  type CngxTabHandle,
} from './tab-group-host.token';

/**
 * Async-commit action shape for tab transitions. Receives the origin
 * index (the tab the user is leaving) and the intended target index
 * (the tab they clicked / arrowed to). Resolves with `true` to commit
 * the transition, `false` to refuse. The
 * `Observable | Promise | sync` union mirrors every other cngx
 * commit-action signature in the repo (select family, stepper).
 *
 * @category interactive/tabs
 */
export type CngxTabsCommitAction = (
  fromIndex: number,
  toIndex: number,
) => boolean | Promise<boolean> | Observable<boolean>;

/**
 * Tab-group presenter — the brain of every tab flow in cngx. Holds
 * the active-index model, the tab registry, the orientation, the
 * loop policy, and (post-Phase-3) the commit-controller's lifecycle.
 * Provides {@link CNGX_TAB_GROUP_HOST} so atoms register against an
 * opaque contract, and {@link CNGX_STATEFUL} so transition bridges
 * (`<cngx-toast-on />`, `<cngx-banner-on />`) compose without
 * explicit `[state]` wiring.
 *
 * **Layer:** `@cngx/common/tabs` (Level 2). Zero `@Component`,
 * zero `.html` — directive-only surface. Level-4 organisms
 * (`<cngx-tab-group>`) compose this via `hostDirectives`; consumer
 * DOM with `[cngxTabGroup]` applied works equally well (the
 * Phase-1 headless demo proves it).
 *
 * @category interactive
 */
@Directive({
  selector: '[cngxTabGroup]',
  exportAs: 'cngxTabGroup',
  standalone: true,
  providers: [
    { provide: CNGX_TAB_GROUP_HOST, useExisting: CngxTabGroupPresenter },
    { provide: CNGX_STATEFUL, useExisting: CngxTabGroupPresenter },
  ],
})
export class CngxTabGroupPresenter implements CngxTabGroupHost {
  readonly activeIndex = model<number>(0);
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  readonly loop = input<boolean>(true);

  /**
   * @experimental Phase 1 declares the input shape; Phase 3 wires
   * the commit-controller into `select(...)`. Binding
   * `[commitAction]` in Phase 1 is a no-op.
   */
  readonly commitAction = input<CngxTabsCommitAction | null>(null);
  /**
   * @experimental Companion to `commitAction`; only consulted once
   * the Phase 3 wiring lands.
   */
  readonly commitMode = input<'optimistic' | 'pessimistic'>('optimistic');

  private readonly genericFactory = inject(CNGX_COMMIT_CONTROLLER_FACTORY);
  private readonly commitController: CngxCommitController<number> =
    this.genericFactory<number>();
  private readonly commitHandler: CngxTabsCommitHandler = inject(
    CNGX_TABS_COMMIT_HANDLER_FACTORY,
  )({ controller: this.commitController });

  /** Producer surface for the `CNGX_STATEFUL` bridge contract. */
  readonly state: CngxAsyncState<number | undefined> = this.commitController.state;
  readonly commitState: CngxAsyncState<number | undefined> =
    this.commitController.state;
  /**
   * The tab index the user is currently trying to commit to —
   * tracked separately from `state.data()` because the AsyncState
   * data slot only updates on success. Drives per-tab `aria-busy`
   * rendering once Phase 3 lands.
   */
  readonly intendedIndex: Signal<number | undefined> =
    this.commitController.intendedValue;

  private readonly tabsState = signal<readonly CngxTabHandle[]>([], {
    equal: tabsEqual,
  });
  readonly tabs: Signal<readonly CngxTabHandle[]> = this.tabsState.asReadonly();

  private readonly clampedIndex = computed(() => {
    const count = this.tabs().length;
    if (count === 0) {
      return 0;
    }
    return Math.max(0, Math.min(this.activeIndex(), count - 1));
  });

  readonly activeId: Signal<string | null> = computed(
    () => this.tabs()[this.clampedIndex()]?.id ?? null,
    { equal: Object.is },
  );

  register(handle: CngxTabHandle): void {
    const current = this.tabsState();
    const idx = current.findIndex((h) => h.id === handle.id);
    if (idx >= 0) {
      const next = current.slice();
      next[idx] = handle;
      this.tabsState.set(next);
      return;
    }
    this.tabsState.set([...current, handle]);
  }

  unregister(id: string): void {
    const current = this.tabsState();
    const next = current.filter((h) => h.id !== id);
    if (next.length !== current.length) {
      this.tabsState.set(next);
    }
  }

  select(index: number): void {
    const tabs = this.tabs();
    if (tabs.length === 0) {
      return;
    }
    const target = Math.max(0, Math.min(index, tabs.length - 1));
    if (tabs[target].disabled()) {
      return;
    }
    const previous = this.activeIndex();
    if (target === previous) {
      return;
    }

    const action = this.commitAction();
    if (!action) {
      this.activeIndex.set(target);
      return;
    }

    // Commit-action gated transition. Optimistic mode (default —
    // tab change is a navigation, not a save; eager visual feedback
    // matches the user's mental model) writes immediately and rolls
    // back on rejection. Pessimistic mode keeps `activeIndex` at
    // `previous` until the action resolves. Supersede semantics
    // come from the lifted commit-controller — a rapid second
    // select() cancels the in-flight runner.
    const mode = this.commitMode();
    if (mode === 'optimistic') {
      this.activeIndex.set(target);
    }
    this.commitHandler.beginTransition(previous, target, action, (accept) => {
      if (accept && mode === 'pessimistic') {
        this.activeIndex.set(target);
      } else if (!accept && mode === 'optimistic') {
        this.activeIndex.set(previous);
      }
    });
  }

  selectNext(): void {
    const tabs = this.tabs();
    if (tabs.length === 0) {
      return;
    }
    let next = this.activeIndex() + 1;
    while (next < tabs.length && tabs[next].disabled()) {
      next++;
    }
    if (next < tabs.length) {
      this.select(next);
      return;
    }
    if (this.loop()) {
      let i = 0;
      while (i < tabs.length && tabs[i].disabled()) {
        i++;
      }
      if (i < tabs.length && i !== this.activeIndex()) {
        this.select(i);
      }
    }
  }

  selectPrevious(): void {
    const tabs = this.tabs();
    if (tabs.length === 0) {
      return;
    }
    let prev = this.activeIndex() - 1;
    while (prev >= 0 && tabs[prev].disabled()) {
      prev--;
    }
    if (prev >= 0) {
      this.select(prev);
      return;
    }
    if (this.loop()) {
      let i = tabs.length - 1;
      while (i >= 0 && tabs[i].disabled()) {
        i--;
      }
      if (i >= 0 && i !== this.activeIndex()) {
        this.select(i);
      }
    }
  }

  selectById(id: string): void {
    const tabs = this.tabs();
    const idx = tabs.findIndex((h) => h.id === id);
    if (idx >= 0) {
      this.select(idx);
    }
  }
}

/**
 * Structural equality for the tab registry signal. Compares length
 * + per-entry `id`, current `disabled()`, and current `label()`.
 *
 * `errorAggregator` is intentionally NOT compared — the aggregator
 * handle is a stable per-tab reference injected once; comparing it
 * would force consumers to memoise the handle, defeating the
 * structural-equal contract.
 *
 * Reading the `disabled` / `label` signals here is safe: the
 * comparator runs synchronously inside `signal.set()` outside any
 * tracking context, so the reads do not subscribe.
 *
 * @internal
 */
export function tabsEqual(
  a: readonly CngxTabHandle[],
  b: readonly CngxTabHandle[],
): boolean {
  if (a === b) {
    return true;
  }
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (
      a[i].id !== b[i].id ||
      a[i].disabled() !== b[i].disabled() ||
      a[i].label() !== b[i].label()
    ) {
      return false;
    }
  }
  return true;
}
