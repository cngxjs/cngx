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
import type { CngxTabIcon, CngxTabIconContext } from './tab-icon.directive';
import type {
  CngxTabRejectionIcon,
  CngxTabRejectionIconContext,
} from './tab-rejection-icon.directive';

/**
 * Inputs to {@link createTabGroupTemplateBindings}. The organism owns
 * the `contentChild()` queries (NG8110 — must run in component
 * injection context) and the resolved {@link CngxTabsConfig}; the
 * factory runs the 3-stage cascade per slot key. Sibling shape to
 * `createStepperTemplateBindings`.
 *
 * @category common/tabs/slots
 */
export interface CngxTabGroupTemplateBindingsOptions {
  readonly errorBadgeSlot: Signal<CngxTabErrorBadge | undefined>;
  readonly rejectionIconSlot: Signal<CngxTabRejectionIcon | undefined>;
  readonly busySpinnerSlot: Signal<CngxTabBusySpinner | undefined>;
  readonly iconSlot: Signal<CngxTabIcon | undefined>;
  readonly config: CngxTabsConfig;
}

/**
 * Output of {@link createTabGroupTemplateBindings}. One resolved
 * `Signal<TemplateRef | null>` per slot; `null` means the organism
 * renders its built-in default.
 *
 * @category common/tabs/slots
 */
export interface CngxTabGroupTemplateBindings {
  readonly errorBadge: Signal<TemplateRef<CngxTabErrorBadgeContext> | null>;
  readonly rejectionIcon: Signal<
    TemplateRef<CngxTabRejectionIconContext> | null
  >;
  readonly busySpinner: Signal<TemplateRef<CngxTabBusySpinnerContext> | null>;
  readonly icon: Signal<TemplateRef<CngxTabIconContext> | null>;
}

/**
 * Wires the 3-stage template cascade for the three `<cngx-tab-group>`
 * skin slots:
 *   per-instance directive >
 *   `CNGX_TABS_CONFIG.templates.<key>` >
 *   `null` (built-in default).
 *
 * Pure — no DI, no side effects. Safe in field-init. Sibling to
 * `createStepperTemplateBindings` and `createTabOverflowTemplateBindings`.
 *
 * Single-consumer today: `[cngxMatTabs]` does not consume this —
 * Material owns the rendered tab-button chrome via its own MDC
 * template, leaving no DOM seam. See `tabs-accepted-debt §9`.
 *
 * @category common/tabs/slots
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
    icon: computed<TemplateRef<CngxTabIconContext> | null>(
      () => opts.iconSlot()?.templateRef ?? opts.config.templates?.icon ?? null,
    ),
  };
}
