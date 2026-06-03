import { computed, type Signal } from '@angular/core';
import type {
  CngxStepperConfig,
  CngxStepperMobileIndicatorPosition,
  CngxStepperSkin,
} from './stepper-config';

/**
 * Input bundle for {@link createStepperHostAttrs}: the three per-instance
 * inputs (each `Signal<T | undefined>`) and the resolved config (read
 * synchronously at construction). Each cascade collapses through
 * `input ?? config ?? library-default`.
 *
 * @category common/stepper
 */
export interface CngxStepperHostAttrsInputs {
  readonly skin: Signal<CngxStepperSkin | undefined>;
  readonly connectors: Signal<boolean | undefined>;
  readonly mobileIndicatorPosition: Signal<CngxStepperMobileIndicatorPosition | undefined>;
  readonly config: CngxStepperConfig;
}

/**
 * Three host-attribute signals for `<cngx-stepper>`. Each is read by a
 * `[attr.data-*]` host binding on the organism.
 *
 * @category common/stepper
 */
export interface CngxStepperHostAttrs {
  readonly resolvedSkin: Signal<CngxStepperSkin>;
  readonly resolvedConnectors: Signal<boolean>;
  readonly resolvedMobileIndicatorPosition: Signal<CngxStepperMobileIndicatorPosition>;
}

/**
 * Level-2 helper resolving the three host-attribute cascades for
 * `<cngx-stepper>` (skin / connectors / mobileIndicatorPosition). Keeps
 * the organism class under the LOC guard while making the cascade
 * pattern reusable for any future host-attr the strip surfaces.
 *
 * Each computed honors Pillar 1 (Ableitung statt Verwaltung): per-instance
 * input wins over root config wins over library default. No manual sync.
 *
 * @category common/stepper
 */
export function createStepperHostAttrs(
  inputs: CngxStepperHostAttrsInputs,
): CngxStepperHostAttrs {
  return {
    resolvedSkin: computed<CngxStepperSkin>(
      () => inputs.skin() ?? inputs.config.skin ?? 'classic',
    ),
    resolvedConnectors: computed<boolean>(
      () => inputs.connectors() ?? inputs.config.connectors ?? false,
    ),
    resolvedMobileIndicatorPosition: computed<CngxStepperMobileIndicatorPosition>(
      () => inputs.mobileIndicatorPosition() ?? inputs.config.mobileIndicatorPosition ?? 'top',
    ),
  };
}
