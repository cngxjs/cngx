import { computed, type Signal } from '@angular/core';
import { injectContainerSize } from '@cngx/common/layout';

import type { CngxStepperMobileCollapse } from './stepper-config';

/**
 * Reads the stepper's collapse flag off its own container.
 *
 * The threshold is a `@container` rule in `stepper-base.css` writing
 * `--cngx-stepper-collapse` onto `.cngx-stepper::after`. It lands on the
 * pseudo-element because a container query cannot style its own container,
 * and the query container for a pseudo-element is selected from its
 * originating element's inclusive ancestors. Nothing here parses a width, so
 * a consumer re-aims the collapse with a plain CSS rule.
 *
 * Call it from an injection context; the observer is scoped to the caller's
 * `DestroyRef`.
 *
 * @param host The `<cngx-stepper>` host element, which is its own container.
 * @category common/stepper
 * @relatedTo createStepperDisplayMode
 */
export function createStepperCollapseSignal(host: Element): Signal<boolean> {
  const raw = injectContainerSize(host).property('--cngx-stepper-collapse', host, '::after');
  return computed(() => raw() === '1');
}

/**
 * Resolves the active stepper display mode by combining the collapse *signal*
 * - whether the stepper's own container is narrow - with the configured
 * `mobileCollapse` policy. `'classic'` keeps the full strip; `'text'` /
 * `'dots'` swap to the matching compact variant, `'off'` stays classic at any
 * width.
 *
 * The factory takes no DOM API and holds no threshold: *where* the collapse
 * happens is a `@container` rule in the stepper stylesheet, *what* it collapses
 * into is this policy. See `core-concepts/responsive-by-default.md`.
 *
 * @param collapsed `true` while the container sits below the collapse rung.
 * @param mobileCollapse The configured collapse policy, read lazily.
 * @category common/stepper
 */
export function createStepperDisplayMode(
  collapsed: Signal<boolean>,
  mobileCollapse: () => CngxStepperMobileCollapse | undefined,
): Signal<'classic' | 'text' | 'dots'> {
  return computed(() => {
    if (!collapsed()) {
      return 'classic';
    }
    const mode = mobileCollapse() ?? 'text';
    return mode === 'off' ? 'classic' : mode;
  });
}
