import { computed, Directive, inject, input, isDevMode, type Signal } from '@angular/core';

import { CngxAsyncClick } from '@cngx/common/interactive';

import { CNGX_STEPPER_HOST, type CngxStepperHost } from '../stepper-host.token';

/**
 * Turns any clickable element into a stepper "Continue" control. Same
 * host resolution as `CngxStepperCount` - explicit `[host]` input
 * falling back to the ambient {@link CNGX_STEPPER_HOST}.
 *
 * `(click)` advances via `selectNext()`. A turnkey re-entrancy guard
 * disables the control when there is no enabled next step
 * (`!canGoNext()`) OR while a commit is in flight (`busy()`) - an opt-in
 * guard a consumer forgets is a silent double-commit (Pillar 2). The
 * gate reads the host's `canGoNext` bound, which derives from the same
 * `select()` predicates, so the affordance can never drift from the
 * navigation it triggers.
 *
 * Writes `[disabled]` / `aria-disabled` only - NEVER `aria-busy`. The
 * busy reflection is `CngxAsyncStatus`'s sole responsibility; co-placing
 * `[cngxAsyncClick]` here (which also writes `[disabled]`) warns in dev
 * mode.
 *
 * ```html
 * <button cngxStepperNext>Continue</button>
 * ```
 *
 * @category common/stepper
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/stepper/controls/stepper-next.directive.ts
 * @since 0.1.0
 * @relatedTo CngxStepperPrevious, CngxStepperComplete, CngxAsyncStatus, CngxStepperHost
 */
@Directive({
  selector: '[cngxStepperNext]',
  standalone: true,
  exportAs: 'cngxStepperNext',
  host: {
    '(click)': 'handleClick($event)',
    '[attr.disabled]': 'disabledAttr()',
    '[attr.aria-disabled]': 'disabled() || null',
  },
})
export class CngxStepperNext {
  /**
   * Explicit stepper-host reference for placement *outside* the stepper
   * tree (`[host]="s.presenter"`). When unset, the ambient
   * {@link CNGX_STEPPER_HOST} is injected.
   */
  readonly host = input<CngxStepperHost | null>(null);

  private readonly injectedHost = inject(CNGX_STEPPER_HOST, { optional: true });
  private readonly resolvedHost = computed<CngxStepperHost | null>(
    () => this.host() ?? this.injectedHost,
  );

  private readonly coPlacedAsyncClick = inject(CngxAsyncClick, { self: true, optional: true });

  /** `true` when advancing is unavailable: no enabled next step or commit busy. */
  protected readonly disabled: Signal<boolean> = computed(() => {
    const host = this.resolvedHost();
    return !host || !host.canGoNext() || host.busy();
  });

  /** @internal - `''` (attribute present) when disabled, else `null`. */
  protected readonly disabledAttr = computed<'' | null>(() => (this.disabled() ? '' : null));

  constructor() {
    if (isDevMode() && this.coPlacedAsyncClick) {
      console.warn(
        'CngxStepperNext: [cngxStepperNext] and [cngxAsyncClick] on the same element ' +
          'both write [disabled]. Use one or the other.',
      );
    }
  }

  /** @internal */
  protected handleClick(event: Event): void {
    if (this.disabled()) {
      event.preventDefault();
      return;
    }
    this.resolvedHost()?.selectNext();
  }
}
