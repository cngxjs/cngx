import { computed, Directive, inject, input } from '@angular/core';
import { injectDirection } from '@cngx/core';

import type { SwipeDirection } from '@cngx/common/interactive';

import { injectStepperConfig } from './stepper-config';
import { CNGX_STEPPER_HOST } from './stepper-host.token';

/**
 * Routes a `CngxSwipe` gesture into the stepper presenter so the
 * organism's mobile-collapse panels gain swipe-driven navigation
 * without duplicating pointer handling. Applied via `hostDirectives`
 * on `<cngx-stepper>`; consumer-facing input `[mobileSwipe]` is
 * forwarded through the host metadata.
 *
 * Cascade for `swipeEnabled`: per-instance `[mobileSwipe]` ->
 * `CNGX_STEPPER_CONFIG.mobileSwipe` -> library default `true`.
 *
 * Direction routing is asymmetric, matching the presenter's existing
 * navigation surface: the forward swipe (`left` under `ltr`, `right`
 * under `rtl`) -> `selectNext()` -> `select()` (linear gate + commit
 * window apply identically to a click); the back swipe ->
 * `selectPrevious()`, gated on `busy()` like the strip back-arrow.
 *
 * @category common/stepper
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/stepper/swipe-nav.directive.ts
 * @since 0.1.0
 */
@Directive({
  selector: '[cngxStepperSwipeNav]',
  standalone: true,
})
export class CngxStepperSwipeNav {
  /**
   * Per-instance opt-out for the built-in swipe navigation. `undefined`
   * defers to the config cascade.
   */
  readonly mobileSwipe = input<boolean | undefined>(undefined);

  private readonly host = inject(CNGX_STEPPER_HOST);
  private readonly config = injectStepperConfig();
  private readonly direction = injectDirection();

  /** Resolved enabled flag (Input -> config -> default(true)). Boolean output, no `equal` fn required. */
  readonly swipeEnabled = computed<boolean>(
    () => this.mobileSwipe() ?? this.config.mobileSwipe ?? true,
  );

  /**
   * Route a swipe direction into the presenter. The inline mapping
   * resolves against the document direction like the keyboard path:
   * under `ltr` a left swipe advances; under `rtl` the roles flip.
   * Vertical directions are ignored. The back path waits while a
   * commit is in flight - a stray gesture must not supersede it (the
   * programmatic `selectPrevious()` cancels deliberately).
   */
  handleSwipe(direction: SwipeDirection): void {
    if (direction !== 'left' && direction !== 'right') {
      return;
    }
    const forward = direction === (this.direction() === 'rtl' ? 'right' : 'left');
    if (forward) {
      this.host.selectNext();
    } else {
      if (this.host.busy()) {
        return;
      }
      this.host.selectPrevious();
    }
  }
}
