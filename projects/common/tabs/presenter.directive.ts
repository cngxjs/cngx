import {
  computed,
  Directive,
  inject,
  Injector,
  input,
  model,
  output,
  signal,
  type Signal,
} from '@angular/core';

import {
  CNGX_COMMIT_CONTROLLER_FACTORY,
  type CngxCommitController,
  type CngxTransitionOutcome,
} from '@cngx/common/data';
import {
  CNGX_STATEFUL,
  createTransitionTracker,
  type CngxAsyncState,
  type StatusTransition,
} from '@cngx/core/utils';
import type { Observable } from 'rxjs';

import { CNGX_TABS_COMMIT_ACTION, type CngxTabsCommitActionSource } from './commit-action.token';
import { injectTabsConfig } from './tabs-config';
import { CNGX_TABS_COMMIT_HANDLER_FACTORY, type CngxTabsCommitHandler } from './commit-handler';
import {
  CNGX_TAB_GROUP_HOST,
  type CngxTabCloseEvent,
  type CngxTabGroupHost,
  type CngxTabHandle,
} from './tab-group-host.token';

/**
 * Async-commit action shape for tab transitions. \
 * Receives origin and target indices; resolves `true` to commit, `false` to refuse.
 * `Observable | Promise | sync` union mirrors the rest of the CNGX
 * commit-action family.
 */
export type CngxTabsCommitAction = (
  fromIndex: number,
  toIndex: number,
) => boolean | Promise<boolean> | Observable<boolean>;

/**
 * Tab-group presenter - brain of every CNGX tab flow. \
 * Owns the active-index model, the tab registry, orientation, loop policy,
 * and the commit-controller lifecycle. \
 * Provides {@link CNGX_TAB_GROUP_HOST} for atoms and {@link CNGX_STATEFUL}
 * so `<cngx-toast-on />` / `<cngx-banner-on />` compose without
 * `[state]` wiring.
 *
 * **Layer:** `@cngx/common/tabs`. \
 * Directive-only - organisms compose via `hostDirectives`, consumers attach
 * `[cngxTabGroup]` directly.
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/tabs/presenter.directive.ts
 * @since 0.1.0
 * @relatedTo CngxTab, CngxTabContent, CngxTabLabel, CngxTabsFragmentSync
 * <example-url>http://localhost:4200/#/ui/tabs/tab-commit-action/optimistic-pessimistic-commits-with-bridge-directives</example-url>
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
  private readonly config = injectTabsConfig();

  readonly activeIndex = model<number>(0);

  /**
   * @internal Two-field alias - bind the public `[orientation]`; read
   * the resolved {@link orientation} computed (input ?? config ?? default).
   */
  readonly orientationInput = input<'horizontal' | 'vertical' | undefined>(undefined, {
    alias: 'orientation',
  });
  readonly orientation = computed<'horizontal' | 'vertical'>(
    () => this.orientationInput() ?? this.config.defaultOrientation ?? 'horizontal',
  );

  /**
   * @internal Two-field alias - bind the public `[loop]`; read the
   * resolved {@link loop} computed (input ?? config ?? default).
   */
  readonly loopInput = input<boolean | undefined>(undefined, {
    alias: 'loop',
  });
  readonly loop = computed<boolean>(() => this.loopInput() ?? this.config.defaultLoop ?? true);

  /**
   * Async-commit action gating the transition.
   * When non-null, `select(...)` routes through {@link CngxTabsCommitHandler}; the
   * action's resolution decides whether the change lands. Supersede
   * semantics come from the commit-controller - a rapid second
   * `select(...)` cancels the in-flight runner.
   *
   * @internal Two-field alias - bind the public `[commitAction]`; read
   * the resolved {@link commitAction} computed (input ?? DI fallback).
   */
  readonly commitActionInput = input<CngxTabsCommitAction | null>(null, {
    alias: 'commitAction',
  });
  /**
   * Default `'optimistic'` - tab change is navigation, not a save,
   * so eager visual feedback matches the user's mental model.
   * Switch to `'pessimistic'` when the new tab must wait for the
   * action to confirm.
   *
   * @internal Two-field alias - bind the public `[commitMode]`; read
   * the resolved {@link commitMode} computed (DI fallback mode wins
   * when a routed action is active, else input ?? config ?? default).
   */
  readonly commitModeInput = input<'optimistic' | 'pessimistic' | undefined>(undefined, {
    alias: 'commitMode',
  });

  private readonly injector = inject(Injector);
  // Resolved lazily, never in a field initialiser: a sync directive
  // (e.g. [cngxTabsRouteSync]) provides CNGX_TABS_COMMIT_ACTION via
  // useExisting and itself injects this presenter as its host, so
  // eager injection here would close a construction cycle (NG0200).
  // First read happens at select()/template time - after both
  // directives exist. The source is static per element, so memoising
  // the resolution is safe.
  private injectedActionSource: CngxTabsCommitActionSource | null | undefined;

  private resolveInjectedAction(): CngxTabsCommitActionSource | null {
    if (this.injectedActionSource === undefined) {
      this.injectedActionSource = this.injector.get(CNGX_TABS_COMMIT_ACTION, null);
    }
    return this.injectedActionSource;
  }

  /**
   * Resolved commit-action: the `[commitAction]` input when bound, else
   * the {@link CNGX_TABS_COMMIT_ACTION} DI fallback (routed path), else
   * `null`. `select()` reads this.
   */
  readonly commitAction = computed<CngxTabsCommitAction | null>(
    () => this.commitActionInput() ?? this.resolveInjectedAction()?.action() ?? null,
  );
  /**
   * Resolved commit mode. When the DI fallback supplies an active
   * action its `mode` wins - the routed path pins `'pessimistic'` so a
   * stray `[commitMode]="'optimistic'"` cannot break the
   * route-follows-resolution invariant. Otherwise the `[commitMode]`
   * input drives.
   */
  readonly commitMode = computed<'optimistic' | 'pessimistic'>(() => {
    const source = this.resolveInjectedAction();
    if (source?.action()) {
      return source.mode();
    }
    return this.commitModeInput() ?? this.config.defaultCommitMode ?? 'optimistic';
  });

  /**
   * Emitted when a tab's close affordance is activated (the close
   * button or Delete on the focused tab). The presenter has
   * already moved the active index onto the surviving neighbour; the
   * consumer removes the tab from its own data in the handler.
   */
  readonly tabClose = output<CngxTabCloseEvent>();
  /**
   * Emitted when the add-tab affordance is activated. The consumer
   * appends a tab to its own data; the presenter owns no creation logic.
   */
  readonly tabAdd = output<void>();

  private readonly genericFactory = inject(CNGX_COMMIT_CONTROLLER_FACTORY);
  private readonly commitController: CngxCommitController<number> = this.genericFactory<number>();
  private readonly commitHandler: CngxTabsCommitHandler = inject(CNGX_TABS_COMMIT_HANDLER_FACTORY)({
    controller: this.commitController,
  });

  /** Producer surface for the `CNGX_STATEFUL` bridge contract. */
  readonly state: CngxAsyncState<number | undefined> = this.commitController.state;
  readonly commitState: CngxAsyncState<number | undefined> = this.commitController.state;
  /**
   * Index the user is currently trying to commit to. Tracked
   * separately from `state.data()` (which only updates on success)
   * to drive per-tab `aria-busy`.
   */
  readonly intendedIndex: Signal<number | undefined> = this.commitController.intendedValue;

  /**
   * Current/previous pair for `commitState.status()`. Skin
   * sub-components feed `<span cngxLiveRegion>` from this tracker
   * for declarative SR announcements. Shared across consumers so
   * the tracker's `linkedSignal` is allocated once per presenter.
   */
  readonly commitTransition: StatusTransition = createTransitionTracker(() =>
    this.commitController.state.status(),
  );

  // Persistence-of-rejection surface - see `CngxTabGroupHost.lastOutcome`,
  // `lastFailedIndex` and `originIndexDuringCommit` for the contract. Two
  // event sources, never synced: the settle record and the sequence whose
  // visual marker was cleared. `lastFailedIndex` derives from both, so
  // clearing the marker never touches the announcement record.
  private readonly lastOutcomeState = signal<CngxTransitionOutcome | undefined>(undefined);
  private readonly clearedSequenceState = signal<number | undefined>(undefined);
  // Bumped once per settled refusal or failure. Plain field - only read
  // inside the resolve handler.
  private outcomeSequence = 0;
  private readonly originIndexDuringCommitState = signal<number | undefined>(undefined);
  /** {@inheritDoc CngxTabGroupHost.lastOutcome} */
  readonly lastOutcome: Signal<CngxTransitionOutcome | undefined> =
    this.lastOutcomeState.asReadonly();
  /** {@inheritDoc CngxTabGroupHost.lastFailedIndex} */
  readonly lastFailedIndex: Signal<number | undefined> = computed(() => {
    const outcome = this.lastOutcomeState();
    return outcome && outcome.sequence !== this.clearedSequenceState() ? outcome.index : undefined;
  });
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

  unregister(id: string, handle?: CngxTabHandle): void {
    const current = this.tabsState();
    const entry = current.find((h) => h.id === id);
    if (entry === undefined) {
      return;
    }
    // Instance guard: after an idempotent re-register replaced the stored
    // handle, the superseded instance's destroy is a no-op.
    if (handle !== undefined && entry !== handle) {
      return;
    }
    this.tabsState.set(current.filter((h) => h !== entry));
  }

  /** {@inheritDoc CngxTabGroupHost.clearLastFailed} */
  clearLastFailed(): void {
    this.clearedSequenceState.set(this.lastOutcomeState()?.sequence);
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
      // No-action fast path - `originIndexDuringCommit` stays
      // untouched, so a stale origin can never leak into the
      // live-region announcement.
      this.activeIndex.set(target);
      if (this.lastFailedIndex() === target) {
        this.clearLastFailed();
      }
      return;
    }

    // Open the commit window - origin is captured ONLY here so a
    // stale value never lingers into a non-commit navigation.
    this.originIndexDuringCommitState.set(previous);
    const mode = this.commitMode();
    if (mode === 'optimistic') {
      this.activeIndex.set(target);
    }
    this.commitHandler.beginTransition(previous, target, action, (outcome) => {
      if (outcome === 'accepted') {
        // Window closes on success - origin label no longer needed;
        // clear the rejection marker if the user re-picked the
        // rejected target successfully.
        this.originIndexDuringCommitState.set(undefined);
        if (this.lastFailedIndex() === target) {
          this.clearLastFailed();
        }
        if (mode === 'pessimistic') {
          this.activeIndex.set(target);
        }
        return;
      }
      // Refused or failed - record the outcome on the target; RETAIN the
      // origin so the announcements can resolve the origin label for the
      // rich phrase. Both kinds roll back: optimistic returns to the
      // origin, pessimistic never moved.
      this.lastOutcomeState.set({
        kind: outcome,
        index: target,
        sequence: ++this.outcomeSequence,
      });
      if (mode === 'optimistic') {
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

  requestClose(id: string): void {
    const tabs = this.tabs();
    const index = tabs.findIndex((h) => h.id === id);
    if (index < 0) {
      return;
    }
    const active = this.clampedIndex();
    // Closing a tab BEFORE the active one needs a pre-emptive index
    // shift: the active tab moves down one slot once the consumer
    // removes the closed tab, so decrement to keep the same tab active.
    // Closing the active tab mid-strip (or one after the active) needs
    // no write - `clampedIndex` re-derives against the shorter array
    // and lands on the next tab.
    if (index < active) {
      this.activeIndex.set(active - 1);
    } else if (index === active && index === tabs.length - 1 && index > 0) {
      // Closing the ACTIVE LAST tab: the derived clamp would land on the
      // new last, but the [(activeIndex)] model itself would keep the
      // now out-of-range value - clamp-write so two-way consumers see
      // the real position.
      this.activeIndex.set(index - 1);
    }
    // The rejection markers are flat indices into the same registry, so a
    // close before them drifts the decoration onto the wrong tab (reachable
    // only via the dismissable affordance the organism layers on top). Shift
    // them the same way `activeIndex` shifts, and drop the outcome outright
    // when its own tab is the one closed. A shift copies the sequence, so
    // nothing downstream treats it as a new outcome.
    this.lastOutcomeState.update((outcome) => shiftOutcomeOnClose(outcome, index));
    this.originIndexDuringCommitState.update((origin) =>
      shiftIndexOnClose(origin, index),
    );
    this.tabClose.emit({ id, index });
  }

  requestAdd(): void {
    this.tabAdd.emit();
  }
}

/**
 * Follow a stored flat rejection index across the removal of the tab at
 * `removed`. The referenced tab going away drops the marker (`undefined`);
 * a removal ahead of it shifts it down one slot; a removal after it leaves
 * it put. Keeps `lastFailedIndex` / `originIndexDuringCommit` pointing at the
 * same handle once the consumer removes a dismissed tab from its data.
 *
 * @internal
 */
export function shiftIndexOnClose(
  stored: number | undefined,
  removed: number,
): number | undefined {
  if (stored === undefined || removed === stored) {
    return undefined;
  }
  return removed < stored ? stored - 1 : stored;
}

/**
 * {@link shiftIndexOnClose} for a settle record: the same object when the
 * index stays put (no re-emission), a copy with the shifted index and the
 * SAME sequence when it moves, `undefined` when its own tab is closed.
 *
 * @internal
 */
function shiftOutcomeOnClose(
  outcome: CngxTransitionOutcome | undefined,
  removed: number,
): CngxTransitionOutcome | undefined {
  if (outcome === undefined) {
    return undefined;
  }
  const index = shiftIndexOnClose(outcome.index, removed);
  if (index === undefined) {
    return undefined;
  }
  return index === outcome.index ? outcome : { ...outcome, index };
}

/**
 * Registry equality for the tab registry signal: element-wise reference
 * identity, not structural comparison. Two arrays are equal only when
 * they carry the exact same handle instances in the same order.
 *
 * Handles are stable per-tab references - `label`, `disabled`,
 * `hasError` and friends propagate through the handle's signals, so
 * consumers update off the handle without the registry array
 * re-emitting, and value comparison here would be redundant for an
 * unchanged handle. For a REPLACED handle (idempotent re-register
 * under an id collision) a value compare is actively wrong: it reports
 * the value-identical new instance as equal, discards the write, and
 * leaves the registry serving the destroyed instance's signals.
 * Reference inequality is the change signal.
 *
 * @internal
 */
export function tabsEqual(a: readonly CngxTabHandle[], b: readonly CngxTabHandle[]): boolean {
  if (a === b) {
    return true;
  }
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}
