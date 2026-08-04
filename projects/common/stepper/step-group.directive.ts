import {
  computed,
  DestroyRef,
  Directive,
  inject,
  input,
  signal,
  type OnInit,
  type Signal,
} from '@angular/core';

import { nextUid } from '@cngx/core/utils';

import { CNGX_STEP_GROUP_HOST, type CngxStepGroupHost } from './step-group-host.token';
import { injectStepperConfig } from './stepper-config';
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
 *
 * @category common/stepper
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/stepper/step-group.directive.ts
 * @since 0.1.0
 * @relatedTo CngxStep, CngxStepperPresenter, CngxStepGroupHeader
 * <example-url>http://localhost:4200/#/ui/stepper/stepper-hierarchical/group-nested-steps-trailing-root-step</example-url>
 * <example-url>http://localhost:4200/#/ui/stepper/stepper-hierarchical/expand-active-group-collapse</example-url>
 * <example-url>http://localhost:4200/#/ui/stepper/stepper-hierarchical/group-collapse-summary-count</example-url>
 */
@Directive({
  selector: '[cngxStepGroup]',
  exportAs: 'cngxStepGroup',
  standalone: true,
  providers: [{ provide: CNGX_STEP_GROUP_HOST, useExisting: CngxStepGroup }],
})
export class CngxStepGroup implements CngxStepGroupHost, OnInit {
  readonly id = input<string>(nextUid('cngx-step-group'));
  readonly disabled = input<boolean>(false);
  readonly label = input<string>('');

  private readonly config = injectStepperConfig();

  // Local child registry - only feeds `aggregatedStatus` below.
  // The presenter owns the canonical tree.
  private readonly childRegistry = signal<readonly CngxStepRegistration[]>([]);

  readonly aggregatedStatus: Signal<CngxStepStatus> = computed(
    () => {
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
    },
    { equal: Object.is },
  );

  private readonly stepperHost = inject(CNGX_STEPPER_HOST, { optional: true });
  private readonly destroyRef = inject(DestroyRef);

  /**
   * `true` when this group's children are collapsed to the header node:
   * the focus-driven policy is `'expand-active'`, this group does not
   * hold the active step, and it has at least one child. Pure
   * `computed()` over the host's `activeGroupId` + the resolved policy -
   * never toggled in an event handler (Pillar 1).
   *
   * Consumer-readable via `exportAs: 'cngxStepGroup'` (e.g.
   * `#g="cngxStepGroup"` then `g.isCollapsed()`). The rendered strip
   * group header owns the reactive `aria-expanded` disclosure attribute
   * (`<cngx-stepper>` `groupAriaExpanded`); the projected `[cngxStepGroup]`
   * host element is not rendered in the strip, so it carries no ARIA.
   */
  readonly isCollapsed: Signal<boolean> = computed(() => {
    if (this.config.groupCollapse !== 'expand-active') {
      return false;
    }
    if (this.childRegistry().length === 0) {
      return false;
    }
    return this.stepperHost?.activeGroupId() !== this.id();
  });

  constructor() {
    if (!this.stepperHost) {
      throw new Error(
        'CngxStepGroup: no enclosing CngxStepperPresenter found. ' +
          'Wrap the group inside an element carrying [cngxStepper].',
      );
    }
  }

  ngOnInit(): void {
    // Register in ngOnInit, not the constructor, so a bound `[id]` reaches
    // the registry (see CngxStep). A group MUST register before its child
    // steps or the presenter drops the orphaned children; ngOnInit fires an
    // ancestor group before its descendant steps, so that order holds, and
    // groups and steps share one lifecycle phase - keeping the presenter's
    // insertion-order tree identical to the previous constructor ordering.
    const stepperHost = this.stepperHost!;
    const groupId = this.id();
    stepperHost.register({
      id: groupId,
      kind: 'group',
      label: this.label,
      disabled: this.disabled,
      state: this.aggregatedStatus,
    });
    this.destroyRef.onDestroy(() => stepperHost.unregister(groupId));
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
