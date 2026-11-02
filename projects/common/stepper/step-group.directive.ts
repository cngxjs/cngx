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
import { CngxRuntimeError } from '@cngx/utils';

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
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/stepper/step-group.directive.ts
 * @since 0.1.0
 * @relatedTo CngxStep, CngxStepperPresenter, CngxStepGroupHeader
 * <example-url>/#/ui/stepper/stepper-hierarchical/group-nested-steps-trailing-root-step</example-url>
 * <example-url>/#/ui/stepper/stepper-hierarchical/expand-active-group-collapse</example-url>
 * <example-url>/#/ui/stepper/stepper-hierarchical/group-collapse-summary-count</example-url>
 */
@Directive({
  selector: '[cngxStepGroup]',
  exportAs: 'cngxStepGroup',
  standalone: true,
  providers: [{ provide: CNGX_STEP_GROUP_HOST, useExisting: CngxStepGroup }],
})
export class CngxStepGroup implements CngxStepGroupHost, OnInit {
  /**
   * Identifier the group registers under with the root presenter. Defaults to an auto-generated
   * `cngx-step-group` uid. It is read once in `ngOnInit`, so a bound `[id]` must be set before init;
   * child steps are registered with this id as their parent.
   */
  readonly id = input<string>(nextUid('cngx-step-group'));

  /**
   * Disabled flag of the group node in the step tree. Defaults to `false`. It does not disable the child
   * steps, which keep their own `[disabled]`.
   */
  readonly disabled = input<boolean>(false);

  /**
   * Header text of the group, rendered as the group label in the stepper strip. Defaults to an empty string.
   */
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
      if (states.some((s) => s === 'pending')) {
        // 'pending' can only come from a nested group's own rollup; leaf
        // steps never produce it ('busy' is a per-step presenter concern,
        // not a step state, so no 'busy' arm exists here).
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

  // A group nested inside another group must register through its parent
  // (skipSelf past our own CNGX_STEP_GROUP_HOST provider), or it would
  // silently register as a root and flatten the tree.
  private readonly parentGroupHost = inject(CNGX_STEP_GROUP_HOST, {
    optional: true,
    skipSelf: true,
  });

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
      throw new CngxRuntimeError(
        'CNGX1047',
        typeof ngDevMode !== 'undefined' &&
          ngDevMode &&
          '[cngxStepGroup] must be placed inside an element with [cngxStepper], ' +
            'such as <cngx-stepper>.',
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
    const registrationHost = this.parentGroupHost ?? this.stepperHost!;
    const groupId = this.id();
    const handle: CngxStepRegistration = {
      id: groupId,
      kind: 'group',
      label: this.label,
      disabled: this.disabled,
      state: this.aggregatedStatus,
    };
    registrationHost.register(handle);
    this.destroyRef.onDestroy(() => registrationHost.unregister(groupId, handle));
  }

  /**
   * `CngxStepGroupHost` contract, called by a nested `CngxStep` (or a nested `CngxStepGroup`) in its
   * `ngOnInit`. Adds the handle to the group's own registry, which feeds `aggregatedStatus`, and forwards
   * it to the root presenter with this group's id as parent.
   */
  register(handle: CngxStepRegistration): void {
    this.childRegistry.update((cur) => [...cur, handle]);
    // Forward to the root with this group as parent so the tree shape is correct.
    this.stepperHost!.register(handle, this.id());
  }

  /**
   * `CngxStepGroupHost` contract, called from the destroy hook of a nested `CngxStep` or
   * `CngxStepGroup`. Removes the registration from the group's registry and from the root presenter; when
   * `handle` is passed, only that exact instance is evicted.
   */
  unregister(id: string, handle?: CngxStepRegistration): void {
    // Same instance guard as the presenter: only evict the exact handle
    // (or fall back to id-keyed removal for handle-less callers).
    this.childRegistry.update((cur) =>
      cur.filter((c) => (handle !== undefined ? c !== handle : c.id !== id)),
    );
    this.stepperHost!.unregister(id, handle);
  }
}
