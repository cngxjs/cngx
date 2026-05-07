import {
  contentChildren,
  type DestroyRef,
  Directive,
  effect,
  inject,
  type Injector,
  untracked,
  DestroyRef as InjectableDestroyRef,
  Injector as InjectableInjector,
} from '@angular/core';
import { MatStep, MatStepper } from '@angular/material/stepper';

import { createMaterialBidirectionalSync } from '@cngx/common/data';
import {
  CNGX_STEPPER_HOST,
  CngxStepperPresenter,
} from '@cngx/common/stepper';
import { nextUid } from '@cngx/core/utils';

import {
  createMatStepHandle,
  type CngxMatStepHandleSetup,
} from './material-bridge/handle';

/**
 * Material instrumentation directive — attaches to an existing
 * `<mat-stepper>` and bridges it against a cngx
 * {@link CngxStepperPresenter} so consumers gain commit-action
 * lifecycle, `CNGX_STATEFUL` provision (and therefore
 * `<cngx-toast-on />` / `<cngx-banner-on />` composition), and the
 * cngx step-handle registry — without rewriting their template.
 * One attribute upgrade.
 *
 * Sibling-additive to the existing `<cngx-mat-stepper>` thin-wrapper
 * organism (`@cngx/ui/mat-stepper`'s `mat-stepper.component.ts`):
 * the wrapper authors fresh code with cngx atoms, the instrumentation
 * directive upgrades existing Material markup. `exportAs` differs
 * (`cngxMatStepperDirective`) to avoid the template-ref collision
 * with the wrapper component (which already uses `cngxMatStepper`).
 *
 * Topology mirrors `[cngxMatTabs]`: Material is the host, cngx is
 * the instrumentation layer. `inject(MatStepper, { self: true })`
 * resolves directly off the consumer's element. No content
 * projection, no DI ordering issue —
 * `stepper-accepted-debt §1`'s structural blocker on the
 * **adoption** direction does not apply here.
 *
 * @category interactive
 */
@Directive({
  selector: '[cngxMatStepper]',
  exportAs: 'cngxMatStepperDirective',
  standalone: true,
  hostDirectives: [
    {
      directive: CngxStepperPresenter,
      inputs: [
        'activeStepIndex',
        'linear',
        'orientation',
        'commitAction',
        'commitMode',
      ],
      outputs: ['activeStepIndexChange'],
    },
  ],
})
export class CngxMatStepperBridge {
  private readonly matStepper = inject(MatStepper, { self: true });
  private readonly presenter = inject(CNGX_STEPPER_HOST);
  private readonly destroyRef: DestroyRef = inject(InjectableDestroyRef);
  private readonly injector: Injector = inject(InjectableInjector);

  private readonly matSteps = contentChildren(MatStep, { descendants: true });
  // Per-step registry — strong refs are bounded by the directive's
  // lifetime; `Map` (not `WeakMap`) so the diff loop in
  // `syncHandles` can iterate to find removed steps without a
  // parallel `Set<MatStep>`.
  private readonly setupsByStep = new Map<MatStep, CngxMatStepHandleSetup>();

  constructor() {
    effect(() => {
      const steps = this.matSteps();
      untracked(() => this.syncHandles(steps));
    });

    this.destroyRef.onDestroy(() => {
      for (const setup of this.setupsByStep.values()) {
        this.presenter.unregister(setup.handle.id);
      }
      this.setupsByStep.clear();
    });

    createMaterialBidirectionalSync({
      presenterIndex: this.presenter.activeStepIndex,
      readSelectedIndex: () => this.matStepper.selectedIndex,
      writeSelectedIndex: (i) => {
        this.matStepper.selectedIndex = i;
      },
      // `MatStepper.selectedIndexChange` already emits a plain index,
      // so no `.pipe(map(e => e.selectedIndex))` adapter is needed —
      // mirrors the `MatTabGroup.selectedIndexChange` shape used by
      // the tabs directive.
      selectionChange$: this.matStepper.selectedIndexChange.asObservable(),
      onMaterialSelection: (i) => this.presenter.select(i),
      injector: this.injector,
      destroyRef: this.destroyRef,
    });
  }

  private syncHandles(steps: readonly MatStep[]): void {
    const liveSteps = new Set<MatStep>(steps);

    // Add: only fresh MatSteps get a setup + handle registration.
    // Cached MatSteps survive untouched — no register-churn.
    for (const step of steps) {
      if (this.setupsByStep.has(step)) {
        continue;
      }
      const setup = createMatStepHandle(step, () => nextUid('cngx-mat-step-'));
      this.setupsByStep.set(step, setup);
      this.presenter.register(setup.handle);
    }

    // Remove: any MatStep in our registry that's no longer in the
    // children-set is gone — unregister. Snapshot entries before
    // mutating to defend against future-edit regressions that
    // introduce non-current-key deletes inside the body.
    for (const [step, setup] of Array.from(this.setupsByStep.entries())) {
      if (liveSteps.has(step)) {
        continue;
      }
      this.setupsByStep.delete(step);
      this.presenter.unregister(setup.handle.id);
    }
  }
}
