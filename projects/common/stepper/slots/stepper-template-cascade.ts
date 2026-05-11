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
 * Inputs to {@link createStepperTemplateBindings}. The organism owns
 * the `contentChild()` queries (NG8110 — must run in component
 * injection context) and the resolved {@link CngxStepperConfig}; this
 * factory absorbs the 3-stage cascade per slot key.
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
 * `Signal<TemplateRef | null>` per slot — `null` falls through to the
 * organism's built-in default markup.
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
 * Wires the 3-stage template cascade for the six `<cngx-stepper>`
 * skin slots: per-instance directive > `CNGX_STEPPER_CONFIG.templates.<key>`
 * > `null` (built-in default).
 *
 * Pure — no DI, no side effects. Safe to call from a field-init
 * block. Sibling of `createTabOverflowTemplateBindings` and the
 * family-wide `createTemplateRegistry`.
 *
 * Tabs has no parallel slot surface yet — see
 * `stepper-accepted-debt §3` for the planned Phase-4 closure.
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
