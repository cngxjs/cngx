import { computed, type Signal, type TemplateRef } from '@angular/core';

import type { CngxTabsConfig } from '../tabs-config';
import type {
  CngxTabBusySpinner,
  CngxTabBusySpinnerContext,
} from './tab-busy-spinner.directive';
import type {
  CngxTabErrorBadge,
  CngxTabErrorBadgeContext,
} from './tab-error-badge.directive';
import type {
  CngxTabRejectionIcon,
  CngxTabRejectionIconContext,
} from './tab-rejection-icon.directive';

/**
 * Inputs to {@link createTabGroupTemplateBindings}. The organism
 * keeps the `contentChild()` queries (must run in component
 * injection context per Angular's AOT NG8110 rule) and the
 * resolved {@link CngxTabsConfig}; the factory absorbs the
 * 3-stage cascade resolution per slot key.
 *
 * Sibling shape to {@link createStepperTemplateBindings} from
 * `@cngx/common/stepper`.
 *
 * @category interactive
 */
export interface CngxTabGroupTemplateBindingsOptions {
  readonly errorBadgeSlot: Signal<CngxTabErrorBadge | undefined>;
  readonly rejectionIconSlot: Signal<CngxTabRejectionIcon | undefined>;
  readonly busySpinnerSlot: Signal<CngxTabBusySpinner | undefined>;
  readonly config: CngxTabsConfig;
}

/**
 * Output of {@link createTabGroupTemplateBindings}. One resolved
 * `Signal<TemplateRef | null>` per slot — `null` when neither a
 * per-instance directive nor the config templates field supplies a
 * template, signalling the organism should render its built-in
 * default.
 *
 * @category interactive
 */
export interface CngxTabGroupTemplateBindings {
  readonly errorBadge: Signal<TemplateRef<CngxTabErrorBadgeContext> | null>;
  readonly rejectionIcon: Signal<
    TemplateRef<CngxTabRejectionIconContext> | null
  >;
  readonly busySpinner: Signal<TemplateRef<CngxTabBusySpinnerContext> | null>;
}

/**
 * Wires the family-standard 3-stage template cascade for the three
 * `<cngx-tab-group>` skin slots:
 *   per-instance directive (e.g. `*cngxTabErrorBadge`) >
 *   `CNGX_TABS_CONFIG.templates.<key>` >
 *   `null` (organism falls back to built-in default markup).
 *
 * Pure function — no DI, no side effects, no destroy hooks. Safe to
 * call from a component's field-init block. Mirrors
 * `createStepperTemplateBindings` (the Phase-3 stepper sibling) and
 * `createTabOverflowTemplateBindings` (the molecule-scoped tabs
 * sibling for the More popover) so consumers of any of the three
 * factories see the same shape.
 *
 * Single-consumer note: only `<cngx-tab-group>` consumes this
 * factory today. The Material-twin `[cngxMatTabs]` does NOT — Material
 * owns the rendered tab-button chrome via its own MDC template, so
 * cngx slot directives have no DOM seam there. Tracked as
 * `tabs-accepted-debt §9` (analogous to `stepper-accepted-debt §4`
 * for the stepper sibling). The cascade pattern is uniform; the
 * single-consumer staging is the architectural debt.
 *
 * @category interactive
 */
export function createTabGroupTemplateBindings(
  opts: CngxTabGroupTemplateBindingsOptions,
): CngxTabGroupTemplateBindings {
  return {
    errorBadge: computed<TemplateRef<CngxTabErrorBadgeContext> | null>(
      () =>
        opts.errorBadgeSlot()?.templateRef ??
        opts.config.templates?.errorBadge ??
        null,
    ),
    rejectionIcon: computed<TemplateRef<CngxTabRejectionIconContext> | null>(
      () =>
        opts.rejectionIconSlot()?.templateRef ??
        opts.config.templates?.rejectionIcon ??
        null,
    ),
    busySpinner: computed<TemplateRef<CngxTabBusySpinnerContext> | null>(
      () =>
        opts.busySpinnerSlot()?.templateRef ??
        opts.config.templates?.busySpinner ??
        null,
    ),
  };
}
