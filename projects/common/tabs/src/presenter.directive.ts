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
import {
  CNGX_STATEFUL,
  createTransitionTracker,
  type CngxAsyncState,
  type StatusTransition,
} from '@cngx/core/utils';
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
   * Async-commit action gating the tab transition. When non-null,
   * `select(...)` routes through {@link CngxTabsCommitHandler} so
   * the action's resolution decides whether the change lands.
   * Optimistic mode (the default) writes immediately and rolls back
   * on rejection; pessimistic mode keeps the origin index until the
   * action resolves. Supersede semantics come from the lifted
   * commit-controller — a rapid second `select(...)` cancels the
   * in-flight runner.
   */
  readonly commitAction = input<CngxTabsCommitAction | null>(null);
  /**
   * Companion to {@link commitAction}. Default `'optimistic'` —
   * tab change is a navigation, not a save; eager visual feedback
   * matches the user's mental model. Switch to `'pessimistic'` for
   * save-style transitions where the new tab must wait for the
   * action to confirm.
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
   * rendering.
   */
  readonly intendedIndex: Signal<number | undefined> =
    this.commitController.intendedValue;

  /**
   * Reactive current/previous pair for the commit-state status.
   * Skin sub-components mount a `<span cngxLiveRegion>` whose
   * content reads from this tracker — declarative SR announcements
   * driven by the same source of truth as `commitState`. Shared
   * across consumers so the tracker's `linkedSignal` is allocated
   * once per presenter instance, never per consumer.
   */
  readonly commitTransition: StatusTransition = createTransitionTracker(
    () => this.commitController.state.status(),
  );

  // Persistence-of-error surface — see `CngxTabGroupHost.lastFailedIndex`
  // and `originIndexDuringCommit` for the contract.
  private readonly lastFailedIndexState = signal<number | undefined>(undefined);
  private readonly originIndexDuringCommitState = signal<number | undefined>(
    undefined,
  );
  /** {@inheritDoc CngxTabGroupHost.lastFailedIndex} */
  readonly lastFailedIndex: Signal<number | undefined> =
    this.lastFailedIndexState.asReadonly();
  /** {@inheritDoc CngxTabGroupHost.originIndexDuringCommit} */
  readonly originIndexDuringCommit: Signal<number | undefined> =
    this.originIndexDuringCommitState.asReadonly();

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

  /** {@inheritDoc CngxTabGroupHost.clearLastFailed} */
  clearLastFailed(): void {
    this.lastFailedIndexState.set(undefined);
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
      // No-action fast path — activeIndex moves synchronously, no
      // commit window opens, so `originIndexDuringCommit` stays
      // untouched (the live-region computed gates origin reads on
      // `lastFailedIndex`, so a stale origin can never leak into
      // the announcement). If the user is re-picking a previously-
      // failed target, clear the rejection flag.
      this.activeIndex.set(target);
      if (this.lastFailedIndexState() === target) {
        this.lastFailedIndexState.set(undefined);
      }
      return;
    }

    // Commit-action gated transition. Optimistic mode (default —
    // tab change is a navigation, not a save; eager visual feedback
    // matches the user's mental model) writes immediately and rolls
    // back on rejection. Pessimistic mode keeps `activeIndex` at
    // `previous` until the action resolves. Supersede semantics
    // come from the lifted commit-controller — a rapid second
    // select() cancels the in-flight runner.
    //
    // Open the commit window: capture the safe-harbour origin
    // exactly once. Written ONLY here (not on the no-action fast
    // path) so a stale origin never lingers into a non-commit
    // navigation.
    this.originIndexDuringCommitState.set(previous);
    const mode = this.commitMode();
    if (mode === 'optimistic') {
      this.activeIndex.set(target);
    }
    this.commitHandler.beginTransition(previous, target, action, (accept) => {
      if (accept) {
        // Window closes on success — origin label no longer needed;
        // clear the rejection flag if the user re-picked the failed
        // target successfully (axis 4a).
        this.originIndexDuringCommitState.set(undefined);
        if (this.lastFailedIndexState() === target) {
          this.lastFailedIndexState.set(undefined);
        }
        if (mode === 'pessimistic') {
          this.activeIndex.set(target);
        }
      } else {
        // Reject — flag the refused target; RETAIN the origin so
        // the organism's `liveAnnouncement` computed can resolve
        // the origin label for the rich rollback phrase. Optimistic
        // rolls back; pessimistic never moved.
        this.lastFailedIndexState.set(target);
        if (mode === 'optimistic') {
          this.activeIndex.set(previous);
        }
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
