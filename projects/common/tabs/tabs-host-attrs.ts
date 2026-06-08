import { computed, type Signal } from '@angular/core';

import type {
  CngxTabAlign,
  CngxTabIconLayout,
  CngxTabsConfig,
  CngxTabsPanelMode,
  CngxTabsSkin,
} from './tabs-config';

/**
 * Input bundle for {@link createTabsHostAttrs}: the per-instance inputs
 * (each `Signal<T | undefined>`) and the resolved config (read
 * synchronously at construction). Each cascade collapses through
 * `input ?? config ?? library-default`.
 *
 * @internal
 */
export interface CngxTabsHostAttrsInputs {
  readonly skin: Signal<CngxTabsSkin | undefined>;
  readonly iconLayout: Signal<CngxTabIconLayout | undefined>;
  readonly panelMode: Signal<CngxTabsPanelMode | undefined>;
  readonly fitted: Signal<boolean | undefined>;
  readonly tabAlign: Signal<CngxTabAlign | undefined>;
  readonly config: CngxTabsConfig;
}

/**
 * Host-attribute signals for `<cngx-tab-group>`. Each is read by a
 * `[attr.data-*]` host binding on the organism.
 *
 * @internal
 */
export interface CngxTabsHostAttrs {
  readonly resolvedSkin: Signal<CngxTabsSkin>;
  readonly resolvedIconLayout: Signal<CngxTabIconLayout>;
  readonly resolvedPanelMode: Signal<CngxTabsPanelMode>;
  readonly resolvedFitted: Signal<boolean>;
  readonly resolvedTabAlign: Signal<CngxTabAlign>;
}

/**
 * Level-2 helper resolving the host-attribute cascades for
 * `<cngx-tab-group>` (skin / iconLayout). Keeps the organism class
 * under the LOC guard while making the cascade pattern reusable. Sibling
 * shape to `createStepperHostAttrs`; the resolved-type unions differ per
 * family, so the helpers are siblings, not shared code.
 *
 * Each computed honors Pillar 1 (Ableitung statt Verwaltung):
 * per-instance input wins over root config wins over library default. No
 * manual sync. The library defaults (`'line'` / `'start'`) live here,
 * not in `TABS_CONFIG_DEFAULTS` - mirroring the stepper.
 *
 * @internal
 */
export function createTabsHostAttrs(
  inputs: CngxTabsHostAttrsInputs,
): CngxTabsHostAttrs {
  return {
    resolvedSkin: computed<CngxTabsSkin>(
      () => inputs.skin() ?? inputs.config.skin ?? 'line',
    ),
    resolvedIconLayout: computed<CngxTabIconLayout>(
      () => inputs.iconLayout() ?? inputs.config.iconLayout ?? 'start',
    ),
    resolvedPanelMode: computed<CngxTabsPanelMode>(
      () => inputs.panelMode() ?? inputs.config.panelMode ?? 'eager',
    ),
    resolvedFitted: computed<boolean>(
      () => inputs.fitted() ?? inputs.config.fitted ?? false,
    ),
    resolvedTabAlign: computed<CngxTabAlign>(
      () => inputs.tabAlign() ?? inputs.config.tabAlign ?? 'start',
    ),
  };
}
