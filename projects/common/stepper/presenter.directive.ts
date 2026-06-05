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
  type CngxStepStatus,
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

  unregister(id: string): void {
    const entry = this.registry.get(id);
    if (!entry) {
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
    // into a non-commit navigation.
    this.originIndexDuringCommitState.set(previous);
    const mode = this.commitMode();
    if (mode === 'optimistic') {
      this.activeStepIndex.set(target);
    }
    this.commitHandler.beginTransition(previous, target, action, (accept) => {
      if (accept) {
        // Success - origin no longer needed; clear the rejection
        // flag if the user re-picked the failed target.
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
        // rich rollback phrase. Optimistic rolls back; pessimistic
        // never moved.
        this.lastFailedIndexState.set(target);
        if (mode === 'optimistic') {
          this.activeStepIndex.set(previous);
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

  selectPrevious(): void {
    const prev = this.previousEnabledIndex();
    if (prev >= 0) {
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
    this.commitController.cancel();
  }
}

export type { CngxStepStatus };
