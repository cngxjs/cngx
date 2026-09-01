import {
  afterNextRender,
  computed,
  Directive,
  inject,
  input,
  isDevMode,
  model,
  signal,
  type Signal,
} from '@angular/core';

import { CNGX_COMMIT_CONTROLLER_FACTORY, type CngxCommitController } from '@cngx/common/data';
import {
  CNGX_STATEFUL,
  createTransitionTracker,
  type CngxAsyncState,
  type StatusTransition,
} from '@cngx/core/utils';
import type { Observable } from 'rxjs';

import {
  CNGX_STEPPER_COMMIT_HANDLER_FACTORY,
  type CngxStepperCommitHandler,
} from './commit-handler';
import { injectStepperConfig } from './stepper-config';
import {
  CNGX_STEPPER_HOST,
  type CngxStepperHost,
  type CngxStepNode,
  type CngxStepRegistration,
} from './stepper-host.token';
import { flatStepsEqual, flattenStepTree, stepTreeEqual } from './step-tree.util';

/**
 * Async-commit action for stepper transitions. Receives the origin
 * and target indices; resolves `true` to advance, `false` to refuse.
 * The `Observable | Promise | sync` union matches every cngx
 * commit-action signature.
 *
 * @category common/stepper
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/stepper/presenter.directive.ts
 * @since 0.1.0
 */
export type CngxStepperCommitAction = (
  fromIndex: number,
  toIndex: number,
) => boolean | Promise<boolean> | Observable<boolean>;

/**
 * Stepper presenter - the brain of every stepper / wizard flow.
 * Holds the active-step model, registry, linear policy, orientation,
 * and commit-controller lifecycle. Provides {@link CNGX_STEPPER_HOST}
 * for atom registration and {@link CNGX_STATEFUL} so transition
 * bridges (`<cngx-toast-on />`, `<cngx-banner-on />`) compose without
 * explicit `[state]` wiring.
 *
 * Sheriff: common Level 2. Pure directive - zero template, zero CSS.
 * Level-4 organisms compose this via `hostDirectives`.
 *
 * @category common/stepper
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/stepper/presenter.directive.ts
 * @since 0.1.0
 * @relatedTo CngxStep, CngxStepGroup, CngxStepperRouterSync, CNGX_STEPPER_HOST, CNGX_STEPPER_CONFIG
 * <example-url>http://localhost:4200/#/ui/stepper/stepper-commit-action/pessimistic-optimistic-commits-with-bridge-directives</example-url>
 */
@Directive({
  selector: '[cngxStepper]',
  exportAs: 'cngxStepper',
  standalone: true,
  providers: [
    { provide: CNGX_STEPPER_HOST, useExisting: CngxStepperPresenter },
    { provide: CNGX_STATEFUL, useExisting: CngxStepperPresenter },
  ],
})
export class CngxStepperPresenter implements CngxStepperHost {
  private readonly config = injectStepperConfig();

  readonly activeStepIndex = model<number>(0);
  // Raw *Input slots default undefined so the cascade resolves through
  // CNGX_STEPPER_CONFIG. Must stay public - the template type-checker
  // rejects protected/private on hostDirective alias bindings.
  readonly linearInput = input<boolean | undefined>(undefined, {
    alias: 'linear',
  });
  readonly linear = computed<boolean>(
    () => this.linearInput() ?? this.config.defaultLinear ?? false,
  );

  readonly orientationInput = input<'horizontal' | 'vertical' | undefined>(undefined, {
    alias: 'orientation',
  });
  readonly orientation = computed<'horizontal' | 'vertical'>(
    () => this.orientationInput() ?? this.config.defaultOrientation ?? 'horizontal',
  );

  readonly commitAction = input<CngxStepperCommitAction | null>(null);
  readonly commitModeInput = input<'optimistic' | 'pessimistic' | undefined>(undefined, {
    alias: 'commitMode',
  });
  readonly commitMode = computed<'optimistic' | 'pessimistic'>(
    () => this.commitModeInput() ?? this.config.defaultCommitMode ?? 'pessimistic',
  );

  private readonly genericFactory = inject(CNGX_COMMIT_CONTROLLER_FACTORY);
  private readonly commitController: CngxCommitController<number> = this.genericFactory<number>();
  private readonly commitHandler: CngxStepperCommitHandler = inject(
    CNGX_STEPPER_COMMIT_HANDLER_FACTORY,
  )({ controller: this.commitController });

  /** Producer surface for the `CNGX_STATEFUL` bridge contract. */
  readonly state: CngxAsyncState<number | undefined> = this.commitController.state;

  /**
   * Step index the user is committing to. Tracked separately from
   * `state.data()` because the AsyncState data slot only updates on
   * success. Drives per-step `aria-busy` in the organism.
   */
  readonly intendedStepIndex: Signal<number | undefined> = this.commitController.intendedValue;

  /**
   * Reactive current/previous pair for the commit-state status. Skin
   * sub-components mount a `<span cngxLiveRegion>` reading this
   * tracker. Allocated once per presenter - the underlying
   * `linkedSignal` is shared across all consumers.
   */
  readonly commitTransition: StatusTransition = createTransitionTracker(() =>
    this.commitController.state.status(),
  );

  // Persistence-of-error surface - see CngxStepperHost.lastFailedIndex
  // / originIndexDuringCommit for the contract.
  private readonly lastFailedIndexState = signal<number | undefined>(undefined);

  // Last index a commit actually landed on (or a sync/back move settled
  // on). Rollback + origin resolution use this instead of the per-call
  // `previous`: a rapid second select() supersedes the first while
  // `previous` already points at the never-committed optimistic index,
  // and rolling back there would strand the user mid-air. Plain field -
  // read only inside handlers, never rendered.
  private lastCommittedIndex: number | undefined;
  private readonly originIndexDuringCommitState = signal<number | undefined>(undefined);
  /** {@inheritDoc CngxStepperHost.lastFailedIndex} */
  readonly lastFailedIndex: Signal<number | undefined> = this.lastFailedIndexState.asReadonly();
  /** {@inheritDoc CngxStepperHost.originIndexDuringCommit} */
  readonly originIndexDuringCommit: Signal<number | undefined> =
    this.originIndexDuringCommitState.asReadonly();

  private readonly treeState = signal<readonly CngxStepNode[]>([], {
    equal: stepTreeEqual,
  });
  readonly stepTree: Signal<readonly CngxStepNode[]> = this.treeState.asReadonly();

  readonly flatSteps: Signal<readonly CngxStepNode[]> = computed(
    () => flattenStepTree(this.stepTree()),
    { equal: flatStepsEqual },
  );

  /**
   * Step-only flat projection - terminal nodes in DFS order.
   * Structural-equal via `flatStepsEqual` so downstream computeds
   * don't cascade on shape-stable re-emits. Single source for every
   * `select*` / `clamp` / `activeStepId` lookup - never re-filter
   * `flatSteps()`.
   */
  readonly stepsOnly: Signal<readonly CngxStepNode[]> = computed(
    () => this.flatSteps().filter((n) => n.kind === 'step'),
    { equal: flatStepsEqual },
  );

  private readonly clampedIndex = computed(() => {
    const stepCount = this.stepsOnly().length;
    if (stepCount === 0) {
      return 0;
    }
    const i = this.activeStepIndex();
    return Math.max(0, Math.min(i, stepCount - 1));
  });

  readonly activeStepId: Signal<string | null> = computed(() => {
    const idx = this.clampedIndex();
    return this.stepsOnly()[idx]?.id ?? null;
  });

  /**
   * {@inheritDoc CngxStepperHost.activeGroupId}
   *
   * Single derivation over `activeStepId` and `stepTree` - the root-level
   * group whose subtree holds the active step, or `null` for a
   * root-level active step (e.g. a trailing `Finish`). Walked once here;
   * `CngxStepGroup.isCollapsed`, the strip `aria-expanded` binding, and
   * `visibleStripNodes` read this rather than re-walking the tree.
   */
  readonly activeGroupId: Signal<string | null> = computed(() => {
    const activeId = this.activeStepId();
    if (activeId === null) {
      return null;
    }
    const subtreeHasActive = (node: CngxStepNode): boolean =>
      node.id === activeId || node.children.some(subtreeHasActive);
    for (const root of this.stepTree()) {
      if (root.kind === 'group' && subtreeHasActive(root)) {
        return root.id;
      }
    }
    return null;
  });

  /**
   * {@inheritDoc CngxStepperHost.visibleStripNodes}
   *
   * Flat strip projection honouring the focus-driven group-collapse
   * policy. Under `'off'` it returns `flatSteps()` verbatim (same
   * reference, so the `equal` short-circuits). Under `'expand-active'`
   * every non-active root-level group's subtree is dropped, leaving the
   * group header node alone - the active group and all root-level steps
   * stay. Each retained node keeps its canonical `flatIndex` from
   * `flatSteps`, so per-step state/announcement lookups are unaffected.
   * Returns a fresh array, so it MUST carry `{ equal: flatStepsEqual }`
   * or every re-emit cascades the strip `@for`.
   */
  readonly visibleStripNodes: Signal<readonly CngxStepNode[]> = computed(
    () => {
      const flat = this.flatSteps();
      if (this.config.groupCollapse !== 'expand-active') {
        return flat;
      }
      const activeGroup = this.activeGroupId();
      const collapsedRootIds = new Set(
        this.stepTree()
          .filter((n) => n.kind === 'group' && n.children.length > 0 && n.id !== activeGroup)
          .map((n) => n.id),
      );
      if (collapsedRootIds.size === 0) {
        return flat;
      }
      const byId = new Map(flat.map((n) => [n.id, n] as const));
      const rootAncestorId = (node: CngxStepNode): string => {
        let cur = node;
        while (cur.parentId !== null) {
          const parent = byId.get(cur.parentId);
          if (!parent) {
            break;
          }
          cur = parent;
        }
        return cur.id;
      };
      return flat.filter(
        (node) => collapsedRootIds.has(node.id) || !collapsedRootIds.has(rootAncestorId(node)),
      );
    },
    { equal: flatStepsEqual },
  );

  readonly commitState = this.commitController.state;

  /**
   * Next enabled step-only index after the active one, skipping
   * disabled steps. Returns `stepsOnly().length` when no enabled step
   * follows. Single source for `selectNext()` and the `canGoNext`
   * bound - the traversal lives here, never re-walked at the call site.
   */
  private readonly nextEnabledIndex = computed(() => {
    const stepsOnly = this.stepsOnly();
    let next = this.activeStepIndex() + 1;
    while (next < stepsOnly.length && stepsOnly[next].disabled()) {
      next++;
    }
    return next;
  });

  /**
   * Previous enabled step-only index before the active one, skipping
   * disabled steps. Returns `-1` when no enabled step precedes. Single
   * source for `selectPrevious()` and the `canGoPrevious` bound.
   */
  private readonly previousEnabledIndex = computed(() => {
    const stepsOnly = this.stepsOnly();
    let prev = this.activeStepIndex() - 1;
    while (prev >= 0 && stepsOnly[prev].disabled()) {
      prev--;
    }
    return prev;
  });

  /** {@inheritDoc CngxStepperHost.stepCount} */
  readonly stepCount: Signal<number> = computed(() => this.stepsOnly().length);

  /** {@inheritDoc CngxStepperHost.isFirstStep} */
  readonly isFirstStep: Signal<boolean> = computed(() => this.clampedIndex() <= 0);

  /** {@inheritDoc CngxStepperHost.isLastStep} */
  readonly isLastStep: Signal<boolean> = computed(
    () => this.clampedIndex() >= this.stepCount() - 1,
  );

  /**
   * {@inheritDoc CngxStepperHost.canGoNext}
   *
   * Derives from the same `nextEnabledIndex` + `isLinearBlocked`
   * predicates `select()`/`selectNext()` enforce, so the affordance can
   * never drift from the navigation it gates.
   */
  readonly canGoNext: Signal<boolean> = computed(() => {
    const next = this.nextEnabledIndex();
    return next < this.stepCount() && !this.isLinearBlocked(next);
  });

  /** {@inheritDoc CngxStepperHost.canGoPrevious} */
  readonly canGoPrevious: Signal<boolean> = computed(() => this.previousEnabledIndex() >= 0);

  /** {@inheritDoc CngxStepperHost.busy} */
  readonly busy: Signal<boolean> = computed(() => this.commitState.status() === 'pending');

  /** {@inheritDoc CngxStepperHost.nextStepLabel} */
  readonly nextStepLabel: Signal<string | undefined> = computed(() =>
    this.stepsOnly()[this.nextEnabledIndex()]?.label(),
  );

  /** {@inheritDoc CngxStepperHost.previousStepLabel} */
  readonly previousStepLabel: Signal<string | undefined> = computed(() =>
    this.stepsOnly()[this.previousEnabledIndex()]?.label(),
  );

  constructor() {
    if (isDevMode()) {
      afterNextRender(() => {
        const stepNodes = this.flatSteps().filter((n) => n.kind === 'step');
        if (stepNodes.length > 6 && stepNodes.every((n) => n.parentId === null)) {
          console.warn(
            '[cngx-stepper] more than 6 steps at the same depth; consider wrapping logical groups in <cngx-step-group> for better UX',
          );
        }
      });
    }
  }

  // Flat id lookup; rebuilt into the hierarchical tree on each
  // register/unregister.
  private readonly registry = new Map<
    string,
    { reg: CngxStepRegistration; parentId: string | null; childIds: string[] }
  >();
  private readonly insertionOrder: string[] = [];

  register(handle: CngxStepRegistration, parentId: string | null = null): void {
    if (this.registry.has(handle.id)) {
      // Idempotent re-register - replace the handle, keep the ordering slot.
      const entry = this.registry.get(handle.id)!;
      entry.reg = handle;
      entry.parentId = parentId;
    } else {
      this.registry.set(handle.id, { reg: handle, parentId, childIds: [] });
      this.insertionOrder.push(handle.id);
      if (parentId !== null) {
        const parent = this.registry.get(parentId);
        if (parent) {
          parent.childIds.push(handle.id);
        }
      }
    }
    this.rebuildTree();
  }

  unregister(id: string, handle?: CngxStepRegistration): void {
    const entry = this.registry.get(id);
    if (!entry) {
      return;
    }
    // Instance guard: after an idempotent re-register replaced the stored
    // handle, the superseded instance's destroy is a no-op.
    if (handle !== undefined && entry.reg !== handle) {
      return;
    }
    if (entry.parentId !== null) {
      const parent = this.registry.get(entry.parentId);
      if (parent) {
        parent.childIds = parent.childIds.filter((c) => c !== id);
      }
    }
    this.registry.delete(id);
    const insertIdx = this.insertionOrder.indexOf(id);
    if (insertIdx >= 0) {
      this.insertionOrder.splice(insertIdx, 1);
    }
    this.rebuildTree();
  }

  private rebuildTree(): void {
    const buildNode = (id: string, depth: number): CngxStepNode => {
      const entry = this.registry.get(id)!;
      const children = entry.childIds.map((cid) => buildNode(cid, depth + 1));
      return {
        id,
        kind: entry.reg.kind,
        label: entry.reg.label,
        disabled: entry.reg.disabled,
        state: entry.reg.state,
        errorAggregator: entry.reg.errorAggregator,
        errorMessage: entry.reg.errorMessage,
        children,
        depth,
        parentId: entry.parentId,
        flatIndex: -1,
      };
    };
    const rootIds = this.insertionOrder.filter((id) => this.registry.get(id)!.parentId === null);
    this.treeState.set(rootIds.map((id) => buildNode(id, 0)));
  }

  /** {@inheritDoc CngxStepperHost.clearLastFailed} */
  clearLastFailed(): void {
    this.lastFailedIndexState.set(undefined);
  }

  /**
   * Linear-gate predicate: `true` when linear mode forbids advancing to
   * `target` because an incomplete (non-`success`, non-disabled) step
   * sits between the active index and `target`. The single home for the
   * linear slice check - `select()` and the `canGoNext` bound both
   * consume it so the gate can never drift between navigation and its
   * affordance.
   */
  private isLinearBlocked(target: number): boolean {
    if (!this.linear() || target <= this.activeStepIndex()) {
      return false;
    }
    return this.stepsOnly()
      .slice(this.activeStepIndex(), target)
      .some((n) => n.state() !== 'success' && !n.disabled());
  }

  /**
   * {@inheritDoc CngxStepperHost.canNavigateTo}
   *
   * Wraps the private {@link isLinearBlocked} predicate plus the
   * per-step `disabled` check. The header-reachability contract surface;
   * `isLinearBlocked` stays private so the organism reads this method,
   * never the internal gate.
   */
  canNavigateTo(index: number): boolean {
    const stepsOnly = this.stepsOnly();
    if (index < 0 || index >= stepsOnly.length) {
      return false;
    }
    if (stepsOnly[index].disabled()) {
      return false;
    }
    return !this.isLinearBlocked(index);
  }

  select(index: number): void {
    const stepsOnly = this.stepsOnly();
    if (stepsOnly.length === 0) {
      return;
    }
    const target = Math.max(0, Math.min(index, stepsOnly.length - 1));
    if (this.isLinearBlocked(target)) {
      return;
    }
    if (stepsOnly[target].disabled()) {
      return;
    }
    const previous = this.activeStepIndex();
    if (target === previous) {
      return;
    }

    const action = this.commitAction();
    if (!action) {
      // No-action fast path - sync move, no commit window opens, so
      // `originIndexDuringCommit` stays untouched. Clear the rejection
      // flag if the user re-picked a previously-failed target.
      this.activeStepIndex.set(target);
      this.lastCommittedIndex = target;
      if (this.lastFailedIndexState() === target) {
        this.lastFailedIndexState.set(undefined);
      }
      return;
    }

    // Commit-gated transition. Pessimistic holds at `previous` until
    // the action resolves; optimistic advances now and rolls back on
    // rejection. Supersede comes from the lifted commit-controller -
    // a rapid second select() cancels the in-flight runner.
    //
    // Capture the safe-harbour origin exactly once on commit-window
    // open. Written ONLY on this path so a stale origin never lingers
    // into a non-commit navigation. The origin is the last TRULY
    // committed index, not `previous`: under a superseded optimistic
    // commit `previous` is the never-committed optimistic position.
    const origin = this.lastCommittedIndex ?? previous;
    // Record the origin as truly committed on window open: for the first
    // window `previous` IS the settled start position; for a superseding
    // select the field already holds the real one (idempotent).
    this.lastCommittedIndex = origin;
    this.originIndexDuringCommitState.set(origin);
    const mode = this.commitMode();
    if (mode === 'optimistic') {
      this.activeStepIndex.set(target);
    }
    this.commitHandler.beginTransition(previous, target, action, (accept) => {
      if (accept) {
        // Success - origin no longer needed; clear the rejection
        // flag if the user re-picked the failed target.
        this.lastCommittedIndex = target;
        this.originIndexDuringCommitState.set(undefined);
        if (this.lastFailedIndexState() === target) {
          this.lastFailedIndexState.set(undefined);
        }
        if (mode === 'pessimistic') {
          this.activeStepIndex.set(target);
        }
      } else {
        // Reject - flag the target; RETAIN the origin so
        // `liveAnnouncement` can resolve the origin label for the
        // rich rollback phrase. Optimistic rolls back to the last
        // truly-committed index; pessimistic never moved off it.
        this.lastFailedIndexState.set(target);
        if (mode === 'optimistic') {
          this.activeStepIndex.set(origin);
        }
      }
    });
  }

  selectNext(): void {
    const next = this.nextEnabledIndex();
    if (next < this.stepsOnly().length) {
      this.select(next);
    }
  }

  /**
   * Ungated back-move. Supersedes an in-flight commit: the runner is
   * canceled and the commit state settles to idle, so `busy` cannot
   * latch and a late resolve cannot yank the user forward off the step
   * they explicitly returned to.
   */
  selectPrevious(): void {
    const prev = this.previousEnabledIndex();
    if (prev >= 0) {
      this.cancelAndSettleCommit();
      this.originIndexDuringCommitState.set(undefined);
      this.lastCommittedIndex = prev;
      this.activeStepIndex.set(prev);
    }
  }

  selectById(id: string): void {
    const stepsOnly = this.stepsOnly();
    const idx = stepsOnly.findIndex((n) => n.id === id);
    if (idx >= 0) {
      this.select(idx);
    }
  }

  reset(): void {
    this.activeStepIndex.set(0);
    this.lastCommittedIndex = 0;
    this.originIndexDuringCommitState.set(undefined);
    this.lastFailedIndexState.set(undefined);
    // Settle mid-commit resets to idle - the surface lives on, so a
    // dangling 'pending' would latch busy() forever.
    this.cancelAndSettleCommit();
  }

  /**
   * Cancels the in-flight commit and settles the state to idle. The
   * settle option is load-bearing here - a custom
   * `CNGX_COMMIT_CONTROLLER_FACTORY` implementation that ignores it
   * leaves `busy` latched, which is invisible until a user backs out
   * mid-commit; the dev-mode probe surfaces that immediately.
   */
  private cancelAndSettleCommit(): void {
    this.commitController.cancel({ settle: true });
    if (isDevMode() && this.commitState.status() === 'pending') {
      console.warn(
        '[cngxStepper] the commit controller ignored cancel({ settle: true }) - busy stays ' +
          'latched. Honor the settle option in your CNGX_COMMIT_CONTROLLER_FACTORY override.',
      );
    }
  }
}

export { type CngxStepStatus } from './stepper-host.token';
