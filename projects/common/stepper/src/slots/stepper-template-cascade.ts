import { computed, type Signal, type TemplateRef } from '@angular/core';

import type { CngxStepperConfig } from '../stepper-config';
import type {
  CngxStepBadge,
  CngxStepBadgeContext,
} from './step-badge.directive';
import type {
  CngxStepBusySpinner,
  CngxStepBusySpinnerContext,
} from './step-busy-spinner.directive';
import type {
  CngxStepGroupHeader,
  CngxStepGroupHeaderContext,
} from './step-group-header.directive';
import type {
  CngxStepIndicator,
  CngxStepIndicatorContext,
} from './step-indicator.directive';
import type {
  CngxStepRejection,
  CngxStepRejectionContext,
} from './step-rejection.directive';
import type { CngxStepperEmpty } from './stepper-empty.directive';

/**
 * Inputs to {@link createStepperTemplateBindings}. The organism
 * keeps the `contentChild()` queries (must run in component
 * injection context per Angular's AOT NG8110 rule) and the
 * resolved {@link CngxStepperConfig}; the factory absorbs the
 * 3-stage cascade resolution per slot key.
 *
 * @category interactive
 */
export interface CngxStepperTemplateBindingsOptions {
  readonly indicatorSlot: Signal<CngxStepIndicator | undefined>;
  readonly badgeSlot: Signal<CngxStepBadge | undefined>;
  readonly busySpinnerSlot: Signal<CngxStepBusySpinner | undefined>;
  readonly rejectionSlot: Signal<CngxStepRejection | undefined>;
  readonly groupHeaderSlot: Signal<CngxStepGroupHeader | undefined>;
  readonly emptySlot: Signal<CngxStepperEmpty | undefined>;
  readonly config: CngxStepperConfig;
}

/**
 * Output of {@link createStepperTemplateBindings}. One resolved
 * `Signal<TemplateRef | null>` per slot — `null` when neither a
 * per-instance directive nor the config templates field supplies a
 * template, signalling the organism should render its built-in
 * default.
 *
 * @category interactive
 */
export interface CngxStepperTemplateBindings {
  readonly indicator: Signal<TemplateRef<CngxStepIndicatorContext> | null>;
  readonly badge: Signal<TemplateRef<CngxStepBadgeContext> | null>;
  readonly busySpinner: Signal<TemplateRef<CngxStepBusySpinnerContext> | null>;
  readonly rejection: Signal<TemplateRef<CngxStepRejectionContext> | null>;
  readonly groupHeader: Signal<TemplateRef<CngxStepGroupHeaderContext> | null>;
  readonly empty: Signal<TemplateRef<void> | null>;
}

/**
 * Wires the family-standard 3-stage template cascade for the six
 * `<cngx-stepper>` skin slots:
 *   per-instance directive (e.g. `*cngxStepIndicator`) >
 *   `CNGX_STEPPER_CONFIG.templates.<key>` >
 *   `null` (organism falls back to built-in default markup).
 *
 * Pure function — no DI, no side effects, no destroy hooks. Safe to
 * call from a component's field-init block. Mirrors
 * `createTabOverflowTemplateBindings` (the molecule-scoped tabs
 * sibling) and the family-wide `createTemplateRegistry` pattern.
 *
 * @category interactive
 */
export function createStepperTemplateBindings(
  opts: CngxStepperTemplateBindingsOptions,
): CngxStepperTemplateBindings {
  return {
    indicator: computed<TemplateRef<CngxStepIndicatorContext> | null>(
      () =>
        opts.indicatorSlot()?.templateRef ??
        opts.config.templates?.indicator ??
        null,
    ),
    badge: computed<TemplateRef<CngxStepBadgeContext> | null>(
      () =>
        opts.badgeSlot()?.templateRef ??
        opts.config.templates?.badge ??
        null,
    ),
    busySpinner: computed<TemplateRef<CngxStepBusySpinnerContext> | null>(
      () =>
        opts.busySpinnerSlot()?.templateRef ??
        opts.config.templates?.busySpinner ??
        null,
    ),
    rejection: computed<TemplateRef<CngxStepRejectionContext> | null>(
      () =>
        opts.rejectionSlot()?.templateRef ??
        opts.config.templates?.rejection ??
        null,
    ),
    groupHeader: computed<TemplateRef<CngxStepGroupHeaderContext> | null>(
      () =>
        opts.groupHeaderSlot()?.templateRef ??
        opts.config.templates?.groupHeader ??
        null,
    ),
    empty: computed<TemplateRef<void> | null>(
      () =>
        opts.emptySlot()?.templateRef ??
        opts.config.templates?.empty ??
        null,
    ),
  };
}
