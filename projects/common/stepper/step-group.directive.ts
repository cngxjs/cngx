import {
  computed,
  DestroyRef,
  Directive,
  inject,
  input,
  signal,
  type Signal,
} from '@angular/core';

import { nextUid } from '@cngx/core/utils';

import {
  CNGX_STEP_GROUP_HOST,
  type CngxStepGroupHost,
} from './step-group-host.token';
import {
  CNGX_STEPPER_HOST,
  type CngxStepRegistration,
  type CngxStepStatus,
} from './stepper-host.token';

/**
 * Step-group atom. Registers with the root presenter as a `kind: 'group'`
 * node and provides {@link CNGX_STEP_GROUP_HOST} so nested `CngxStep`
 * atoms register with the group, not the root.
 *
 * `aggregatedStatus` rolls up child states: `error` if any errored,
 * `success` if all are success, `pending` if any is pending or busy,
 * otherwise `idle`.
 * <example-url>http://localhost:4200/stepper-hierarchical/group-nested-steps-trailing-root-step</example-url>
 * <example-url>http://localhost:4200/stepper-slot-overrides/custom-busy-spinner-via-code-cngxstepbusyspinner-code</example-url>
 * <example-url>http://localhost:4200/stepper-slot-overrides/custom-error-badge-via-code-cngxstepbadge-code</example-url>
 * <example-url>http://localhost:4200/stepper-slot-overrides/custom-group-header-via-code-cngxstepgroupheader-code</example-url>
 * <example-url>http://localhost:4200/stepper-slot-overrides/custom-indicator-glyph-via-code-cngxstepindicator-code</example-url>
 * <example-url>http://localhost:4200/stepper-slot-overrides/empty-state-placeholder-via-code-cngxstepperempty-code</example-url>
 * <example-url>http://localhost:4200/stepper-slot-overrides/rejection-decoration-via-code-cngxsteprejection-code</example-url>
 */
@Directive({
  selector: '[cngxStepGroup]',
  exportAs: 'cngxStepGroup',
  standalone: true,
  providers: [{ provide: CNGX_STEP_GROUP_HOST, useExisting: CngxStepGroup }],
})
export class CngxStepGroup implements CngxStepGroupHost {
  readonly id = input<string>(nextUid('cngx-step-group'));
  readonly disabled = input<boolean>(false);
  readonly label = input<string>('');

  // Local child registry — only feeds `aggregatedStatus` below.
  // The presenter owns the canonical tree.
  private readonly childRegistry = signal<readonly CngxStepRegistration[]>([]);

  readonly aggregatedStatus: Signal<CngxStepStatus> = computed(() => {
    const states = this.childRegistry().map((c) => c.state());
    if (states.length === 0) {
      return 'idle';
    }
    if (states.some((s) => s === 'error')) {
      return 'error';
    }
    if (states.some((s) => s === 'pending' || s === 'busy')) {
      return 'pending';
    }
    if (states.every((s) => s === 'success')) {
      return 'success';
    }
    return 'idle';
  }, { equal: Object.is });

  private readonly stepperHost = inject(CNGX_STEPPER_HOST, { optional: true });

  constructor() {
    if (!this.stepperHost) {
      throw new Error(
        'CngxStepGroup: no enclosing CngxStepperPresenter found. ' +
        'Wrap the group inside an element carrying [cngxStepper].',
      );
    }
    const groupId = this.id();
    this.stepperHost.register({
      id: groupId,
      kind: 'group',
      label: this.label,
      disabled: this.disabled,
      state: this.aggregatedStatus,
    });
    const stepperHost = this.stepperHost;
    inject(DestroyRef).onDestroy(() => stepperHost.unregister(groupId));
  }

  register(handle: CngxStepRegistration): void {
    this.childRegistry.update((cur) => [...cur, handle]);
    // Forward to the root with this group as parent so the tree shape is correct.
    this.stepperHost!.register(handle, this.id());
  }

  unregister(id: string): void {
    this.childRegistry.update((cur) => cur.filter((c) => c.id !== id));
    this.stepperHost!.unregister(id);
  }
}
