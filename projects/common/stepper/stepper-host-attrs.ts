import { computed, type Signal } from '@angular/core';
import type { CngxStepperI18n } from './i18n/stepper-i18n';
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
 * @internal
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
 * @internal
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
 * @internal
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

/**
 * Input bundle for {@link createStepperAccname}: the two per-instance
 * accname inputs plus the resolved config and i18n bundle.
 *
 * @internal
 */
export interface CngxStepperAccnameInputs {
  readonly ariaLabel: Signal<string | undefined>;
  readonly ariaLabelledBy: Signal<string | undefined>;
  readonly config: CngxStepperConfig;
  readonly i18n: CngxStepperI18n;
}

/**
 * Shared `aria-label` cascade for every stepper organism host
 * (`<cngx-stepper>` and the compact variants): a bound
 * `aria-labelledby` trumps and nulls the label out; otherwise the
 * per-instance input wins over `ariaLabels.stepperRegion` wins over
 * `i18n.stepperLabel`. One source so the variants cannot drift from
 * the parent's naming behaviour.
 *
 * @internal
 */
export function createStepperAccname(inputs: CngxStepperAccnameInputs): Signal<string | null> {
  return computed<string | null>(() => {
    if (inputs.ariaLabelledBy()) {
      return null; // labelledby trumps label
    }
    return (
      inputs.ariaLabel() ?? inputs.config.ariaLabels?.stepperRegion ?? inputs.i18n.stepperLabel
    );
  });
}
