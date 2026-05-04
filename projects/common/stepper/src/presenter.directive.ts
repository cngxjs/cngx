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
  CNGX_STEPPER_COMMIT_HANDLER_FACTORY,
  type CngxStepperCommitHandler,
} from './commit-handler';
import { injectStepperConfig } from './stepper-config';
import { CNGX_STEPPER_HOST, type CngxStepperHost, type CngxStepNode, type CngxStepRegistration, type CngxStepStatus } from './stepper-host.token';
import { flatStepsEqual, flattenStepTree, stepTreeEqual } from './step-tree.util';

/**
 * Async-commit action shape for stepper transitions. Receives the
 * origin index (the step the user is leaving) and the intended
 * target index (the step they clicked / arrowed to). Resolves with
 * `true` to advance, `false` to refuse the transition. The
 * `Observable | Promise | sync` union mirrors every other cngx
 * commit-action signature in the repo.
 *
 * @category interactive/stepper
 */
export type CngxStepperCommitAction = (
  fromIndex: number,
  toIndex: number,
) => boolean | Promise<boolean> | Observable<boolean>;

/**
 * Stepper presenter — the brain of every stepper / wizard flow in
 * cngx. Holds the active-step model, the step registry, the linear-
 * mode policy, the orientation, and the commit-controller's
 * lifecycle. Provides {@link CNGX_STEPPER_HOST} so atoms register
 * against an opaque contract, and {@link CNGX_STATEFUL} so
 * transition bridges (`<cngx-toast-on />`, `<cngx-banner-on />`)
 * compose without explicit `[state]` wiring.
 *
 * **Layer:** `@cngx/common/stepper` (Level 2). Zero `@Component`,
 * zero `.html`, zero `.css` — the directive is the entire surface.
 * Level-4 organisms (`<cngx-stepper>`, `<cngx-mat-stepper>`)
 * compose this via `hostDirectives`.
 *
 * @category interactive
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
  // Inputs default to `undefined` so `computed` can fall through to
  // the {@link CNGX_STEPPER_CONFIG} cascade (per-instance Input >
  // viewProviders > root > library default). Public types expose
  // the resolved value as `Signal<...>`.
  // Public — the alias `linear` is what external consumers bind via
  // hostDirective forwarding; Angular's template type-checker
  // resolves the alias to this field at the binding site, so it
  // must be visible.
  readonly linearInput = input<boolean | undefined>(undefined, {
    alias: 'linear',
  });
  readonly linear = computed<boolean>(
    () => this.linearInput() ?? this.config.defaultLinear ?? false,
  );

  readonly orientationInput = input<
    'horizontal' | 'vertical' | undefined
  >(undefined, { alias: 'orientation' });
  readonly orientation = computed<'horizontal' | 'vertical'>(
    () =>
      this.orientationInput() ?? this.config.defaultOrientation ?? 'horizontal',
  );

  /**
   * @experimental Phase 1 declares the input shape; the
   * commit-controller wiring (gating `select()` on the action's
   * resolution, optimistic/pessimistic UX) lands in Phase 3 of the
   * stepper-wizard plan. Binding `[commitAction]` in Phase 1 is a
   * no-op.
   */
  readonly commitAction = input<CngxStepperCommitAction | null>(null);
  /**
   * @experimental Companion to `commitAction`; only consulted once
   * the Phase 3 wiring lands.
   */
  readonly commitModeInput = input<
    'optimistic' | 'pessimistic' | undefined
  >(undefined, { alias: 'commitMode' });
  readonly commitMode = computed<'optimistic' | 'pessimistic'>(
    () =>
      this.commitModeInput() ?? this.config.defaultCommitMode ?? 'pessimistic',
  );

  private readonly genericFactory = inject(CNGX_COMMIT_CONTROLLER_FACTORY);
  private readonly commitController: CngxCommitController<number> =
    this.genericFactory<number>();
  private readonly commitHandler: CngxStepperCommitHandler = inject(
    CNGX_STEPPER_COMMIT_HANDLER_FACTORY,
  )({ controller: this.commitController });

  /** Producer surface for the `CNGX_STATEFUL` bridge contract. */
  readonly state: CngxAsyncState<number | undefined> = this.commitController.state;

  /**
   * The step index the user is currently trying to commit to —
   * tracked separately from `state.data()` because the AsyncState
   * data slot only updates on success. Drives per-step
   * `aria-busy` rendering in the organism.
   */
  readonly intendedStepIndex: Signal<number | undefined> =
    this.commitController.intendedValue;

  private readonly treeState = signal<readonly CngxStepNode[]>([], {
    equal: stepTreeEqual,
  });
  readonly stepTree: Signal<readonly CngxStepNode[]> = this.treeState.asReadonly();

  readonly flatSteps: Signal<readonly CngxStepNode[]> = computed(
    () => flattenStepTree(this.stepTree()),
    { equal: flatStepsEqual },
  );

  /**
   * Step-only flat projection — terminal nodes only, in DFS order.
   * Memoised behind a structural-equal `flatStepsEqual` so downstream
   * computeds don't cascade on shape-stable re-emits. Single source
   * for every `select*` / `clamp` / `activeStepId` lookup; consumers
   * inside the presenter MUST read this rather than re-filtering
   * `flatSteps()` themselves.
   */
  private readonly stepsOnly: Signal<readonly CngxStepNode[]> = computed(
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

  // Internal registry — flat lookup table by id; rebuilt into a
  // hierarchical tree on every register/unregister.
  private readonly registry = new Map<
    string,
    { reg: CngxStepRegistration; parentId: string | null; childIds: string[] }
  >();
  private readonly insertionOrder: string[] = [];

  register(handle: CngxStepRegistration, parentId: string | null = null): void {
    if (this.registry.has(handle.id)) {
      // Idempotent re-register; replace the handle but keep the
      // ordering slot.
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
        children,
        depth,
        parentId: entry.parentId,
        flatIndex: -1,
      };
    };
    const rootIds = this.insertionOrder.filter(
      (id) => this.registry.get(id)!.parentId === null,
    );
    this.treeState.set(rootIds.map((id) => buildNode(id, 0)));
  }

  select(index: number): void {
    const stepsOnly = this.stepsOnly();
    if (stepsOnly.length === 0) {
      return;
    }
    const target = Math.max(0, Math.min(index, stepsOnly.length - 1));
    if (this.linear() && target > this.activeStepIndex()) {
      // Linear mode: refuse jumps that skip over an incomplete step.
      const blocking = stepsOnly
        .slice(this.activeStepIndex(), target)
        .find((n) => n.state() !== 'success' && !n.disabled());
      if (blocking) {
        return;
      }
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
      this.activeStepIndex.set(target);
      return;
    }

    // Commit-action gated transition. Pessimistic mode keeps the
    // index at `previous` until the action resolves; optimistic
    // advances now and rolls back on rejection. Supersede semantics
    // come from the lifted commit-controller — a rapid second
    // select() cancels the in-flight runner.
    const mode = this.commitMode();
    if (mode === 'optimistic') {
      this.activeStepIndex.set(target);
    }
    this.commitHandler.beginTransition(previous, target, action, (accept) => {
      if (accept && mode === 'pessimistic') {
        this.activeStepIndex.set(target);
      } else if (!accept && mode === 'optimistic') {
        this.activeStepIndex.set(previous);
      }
    });
  }

  selectNext(): void {
    const stepsOnly = this.stepsOnly();
    let next = this.activeStepIndex() + 1;
    while (next < stepsOnly.length && stepsOnly[next].disabled()) {
      next++;
    }
    if (next < stepsOnly.length) {
      this.select(next);
    }
  }

  selectPrevious(): void {
    const stepsOnly = this.stepsOnly();
    let prev = this.activeStepIndex() - 1;
    while (prev >= 0 && stepsOnly[prev].disabled()) {
      prev--;
    }
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

  // markCompleted / markErrored are deliberately NOT on the
  // presenter until Phase 3 wires the commit lifecycle. The
  // `CngxStepperHost` contract also omits them — see the comment
  // on the interface for the rationale.

  reset(): void {
    this.activeStepIndex.set(0);
    this.commitController.cancel();
  }
}

export type { CngxStepStatus };
