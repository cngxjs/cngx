import {
  afterEveryRender,
  computed,
  Directive,
  ElementRef,
  inject,
  input,
  isDevMode,
  type Signal,
} from '@angular/core';

import { CngxAsyncClick } from '@cngx/common/interactive';

import { injectStepperI18n } from '../i18n/stepper-i18n';
import { CNGX_STEPPER_HOST, type CngxStepperHost } from '../stepper-host.token';

/**
 * Turns any clickable element into a stepper "Back" control. Resolves
 * its host the same way `CngxStepperCount` does - an explicit `[host]`
 * input (for placement outside the stepper tree) falling back to the
 * ambient {@link CNGX_STEPPER_HOST}.
 *
 * `(click)` retreats via `selectPrevious()`. The control disables itself
 * when there is no earlier step (`!canGoPrevious()`) OR while a commit is
 * in flight (`busy()`): `selectPrevious()` writes `activeStepIndex`
 * directly, bypassing the commit controller, so disabling it during an
 * in-flight forward commit prevents a navigate-mid-commit race. The gate
 * is the host's `canGoPrevious` bound - never re-derived from `stepsOnly`.
 *
 * Reflects the disabled state via `aria-disabled` only - never native
 * `disabled` - so the control stays focusable and AT-reachable; the
 * `handleClick` guard blocks the action while disabled.
 *
 * ```html
 * <button cngxStepperPrevious>Back</button>
 * ```
 *
 * @category common/stepper
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/stepper/controls/stepper-previous.directive.ts
 * @since 0.1.0
 * @relatedTo CngxStepperNext, CngxStepperComplete, CngxStepperHost
 */
@Directive({
  selector: '[cngxStepperPrevious]',
  standalone: true,
  exportAs: 'cngxStepperPrevious',
  host: {
    '(click)': 'handleClick($event)',
    '[attr.aria-disabled]': 'disabled() || null',
  },
})
export class CngxStepperPrevious {
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

  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly i18n = injectStepperI18n();

  constructor() {
    // Fallback accessible name for icon-only hosts: while the element
    // renders no text and the consumer supplied no label of their own,
    // the i18n `previousStep` phrase fills the gap. Re-checked after every
    // render (cheap string read) so a late-arriving visible label wins
    // again - a forced aria-label over visible text would break
    // label-in-name (WCAG 2.5.3). The data flag marks ownership so a
    // consumer-authored aria-label is never touched.
    afterEveryRender(() => {
      const el = this.elementRef.nativeElement;
      const ownsFallback = el.hasAttribute('data-cngx-label-fallback');
      const consumerLabelled =
        (!ownsFallback && el.hasAttribute('aria-label')) || el.hasAttribute('aria-labelledby');
      if (consumerLabelled) {
        return;
      }
      const hasText = (el.textContent ?? '').trim() !== '';
      if (hasText && ownsFallback) {
        el.removeAttribute('aria-label');
        el.removeAttribute('data-cngx-label-fallback');
      } else if (!hasText && !ownsFallback) {
        el.setAttribute('aria-label', this.i18n.previousStep);
        el.setAttribute('data-cngx-label-fallback', '');
      }
    });

    if (isDevMode() && this.coPlacedAsyncClick) {
      console.warn(
        'CngxStepperPrevious: [cngxStepperPrevious] and [cngxAsyncClick] on the same element ' +
          'both gate aria-disabled. Use one or the other.',
      );
    }
  }

  /** `true` when retreat is unavailable: no earlier step or commit busy. */
  protected readonly disabled: Signal<boolean> = computed(() => {
    const host = this.resolvedHost();
    return !host || !host.canGoPrevious() || host.busy();
  });

  /** @internal */
  protected handleClick(event: Event): void {
    if (this.disabled()) {
      event.preventDefault();
      return;
    }
    this.resolvedHost()?.selectPrevious();
  }
}
