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
 * Step-group atom. Wraps multiple `CngxStep` children and registers
 * itself with the root presenter as a `kind: 'group'` node. Provides
 * {@link CNGX_STEP_GROUP_HOST} via `useExisting` so nested
 * `CngxStep` atoms register with the group rather than the root.
 *
 * The group's `aggregatedStatus` rolls up child statuses — `error`
 * if any child is errored, `success` if all children are success,
 * `pending` if any is pending, otherwise `idle`. Used by Level-4
 * organisms to render group-level badges.
 *
 * @category interactive
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

  // Internal child registry — drives `aggregatedStatus`. The
  // presenter owns the canonical tree; this signal exists only to
  // observe child status changes for the roll-up computed below.
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
    // Forward registration up to the root presenter with this
    // group's id as parent so the tree shape is correct.
    this.stepperHost!.register(handle, this.id());
  }

  unregister(id: string): void {
    this.childRegistry.update((cur) => cur.filter((c) => c.id !== id));
    this.stepperHost!.unregister(id);
  }
}
