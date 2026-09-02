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

import {
  CNGX_STEPPER_HOST,
  CngxStepperPresenter,
  createStepperAnnouncementBuilders,
  injectStepperI18n,
} from '@cngx/common/stepper';
import { nextUid } from '@cngx/core/utils';

import { mountLiveRegionAnnouncer } from '../material-bridge-shared/live-region';
import { createOrderedRegistrationSeam } from '../material-bridge-shared/ordered-registration';
import { createMatStepperBidirectionalSync } from './material-bridge/bidirectional-sync';
import {
  CNGX_MAT_STEP_HANDLE_FACTORY,
  type CngxMatStepHandleSetup,
} from './material-bridge/handle';

/**
 * The Material twin of the CNGX stepper: attach `cngxMatStepper` to a
 * vanilla `<mat-stepper>` and it is bridged to a
 * {@link CngxStepperPresenter}. \
 * Consumers gain the commit-action
 * lifecycle, `CNGX_STATEFUL` (so `<cngx-toast-on />` /
 * `<cngx-banner-on />` compose as children), the shared
 * `CNGX_STEPPER_HOST` contract (so a `<cngx-stepper-footer>` can drive
 * Back / Next instead of Material's own buttons via
 * `[host]="ref.presenter"`), and the step-handle registry - all from
 * one attribute.
 *
 * This is the instrumentation pattern: Material owns the rendering and
 * the consumer authors native `<mat-step>` markup; CNGX is the
 * behaviour layer. Topology mirrors `[cngxMatTabs]`.
 *
 * Commit-lifecycle transitions speak: the shared announcement builder
 * feeds the root live announcer (pending / landed / rolled-back
 * phrases, identical to `<cngx-stepper>`), and the host carries
 * `aria-busy="true"` while a commit is in flight.
 *
 * Inputs/outputs are forwarded from {@link CngxStepperPresenter}:
 * - `activeStepIndex` (two-way, with `activeStepIndexChange`),
 * - `linear`,
 * - `orientation`,
 * - `commitAction`,
 * - `commitMode`.  \
 * See the presenter for their semantics.
 * ```html
 *   <mat-stepper
 *     cngxMatStepper
 *     #s="cngxMatStepper"
 *     [(activeStepIndex)]="active"
 *     [commitAction]="commitAction"
 *     [commitMode]="mode()"
 *     cngxToastOn
 *     [toastError]="'Step transition failed'"
 *     cngxBannerOn
 *     bannerId="stepper:commit-error"
 *     [bannerError]="'The server rejected the step change.'"
 *     aria-label="Account setup"
 *   >
 *     <mat-step label="Personal info">
 *       <p>Tell us who you are.</p>
 *     </mat-step>
 *     <mat-step
 *       label="Account"
 *       [hasError]="!accepted()"
 *       errorMessage="Accept the terms to continue"
 *     >
 *       <p>Choose your sign-in method.</p>
 *     </mat-step>
 *     <mat-step label="Confirm">
 *       <p>Review everything, then finish.</p>
 *     </mat-step>
 *   </mat-stepper>
 * ```
 * @playground Bridge instrumentation ./examples/bridge/bridge-example.component.ts
 *
 * @category ui/mat-stepper
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/mat-stepper/mat-stepper.directive.ts
 * @since 0.1.0
 * @relatedTo CngxStepper, CngxStepperPresenter, CngxMatTabs, CngxStepperFooter
 */
@Directive({
  selector: '[cngxMatStepper]',
  exportAs: 'cngxMatStepper',
  standalone: true,
  hostDirectives: [
    {
      directive: CngxStepperPresenter,
      inputs: ['activeStepIndex', 'linear', 'orientation', 'commitAction', 'commitMode'],
      outputs: ['activeStepIndexChange'],
    },
  ],
  host: {
    // Communicated busy-state while a commit is in flight - same
    // strict 'pending' gate the cngx-native organism uses per step.
    '[attr.aria-busy]': "presenter.busy() ? 'true' : null",
  },
})
export class CngxMatStepper {
  private readonly matStepper = inject(MatStepper, { self: true });
  /**
   * Shared host contract. Public so a `<cngx-stepper-footer>` placed
   * outside the `<mat-stepper>` can bind `[host]="ref.presenter"` (via
   * `#ref="cngxMatStepper"`) and drive navigation.
   */
  readonly presenter = inject(CNGX_STEPPER_HOST);
  private readonly destroyRef: DestroyRef = inject(InjectableDestroyRef);
  private readonly injector: Injector = inject(InjectableInjector);

  private readonly matSteps = contentChildren(MatStep, { descendants: true });
  private readonly createHandle = inject(CNGX_MAT_STEP_HANDLE_FACTORY);
  private readonly i18n = injectStepperI18n();

  // Shared with [cngxMatTabsRegistry]: the presenter registry appends
  // new registrations, but Material renders steps at their DOM
  // position - a mid-list <mat-step> insert must land at its query
  // index, not at the tail. The seam re-registers the diverging
  // suffix in query order while keeping surviving handle instances.
  private readonly seam = createOrderedRegistrationSeam<MatStep, CngxMatStepHandleSetup>({
    create: (step) => this.createHandle(step, () => nextUid('cngx-mat-step-')),
    register: (setup) => this.presenter.register(setup.handle),
    unregister: (setup) => this.presenter.unregister(setup.handle.id, setup.handle),
    dispose: () => {
      // Step setups carry no per-entry resources (no child injector).
    },
  });

  constructor() {
    effect(() => {
      // Ownership filter: `descendants: true` also surfaces MatSteps of
      // a stepper nested inside one of OUR steps' content. Each CdkStep
      // carries its owning `_stepper` (public in the CDK typings), so
      // foreign steps are dropped before they can register with this
      // presenter.
      const steps = this.matSteps().filter((step) => step._stepper === this.matStepper);
      untracked(() => this.seam.sync(steps));
    });

    this.destroyRef.onDestroy(() => this.seam.clear());

    // Commit-lifecycle announcements (pending / landed / rolled-back).
    // The shared builder computes the phrase; the shared announcer
    // renders it - an attribute directive owns no template, so the
    // polite region lives on the root CngxLiveAnnouncer, mirroring
    // [cngxMatTabs].
    mountLiveRegionAnnouncer({
      announcement: createStepperAnnouncementBuilders({
        presenter: this.presenter,
        stepsOnly: this.presenter.stepsOnly,
        i18n: this.i18n,
      }).liveAnnouncement,
      injector: this.injector,
    });

    createMatStepperBidirectionalSync({
      matStepper: this.matStepper,
      presenter: this.presenter,
      injector: this.injector,
      destroyRef: this.destroyRef,
    });
  }
}
