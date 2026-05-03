import { computed, inject, type Signal } from '@angular/core';
import { resolveAsyncView, type AsyncView } from '@cngx/common/data';
import type { CngxAsyncState } from '@cngx/core/utils';
import { CNGX_CHART_I18N, type CngxChartI18n } from '../i18n/chart-i18n';

/**
 * Reactive bundle returned by {@link injectPresetState}. Each preset
 * exposes `i18n` for fallback labels and `activeView` for the
 * `@switch` template branch.
 *
 * @internal
 */
export interface PresetStateContext {
  readonly i18n: CngxChartI18n;
  readonly activeView: Signal<AsyncView>;
}

/**
 * Shared `[state]` → `activeView` derivation for chart presets. Maps
 * a `CngxAsyncState` (when bound) to the same `AsyncView` discriminator
 * the select family uses; presets render skeleton / empty / error /
 * content branches off the same enum.
 *
 * Returns `'content'` when `state` is unbound — the preset renders its
 * SVG/DOM body without any state envelope. Treats `'content+error'`
 * the same as `'content'` for v1: a four-rect chart preset has no
 * room for an inline-error overlay; consumers compose
 * `<cngx-banner-on />` against the same `[state]` if they need
 * explicit transition feedback.
 *
 * @internal
 */
export function injectPresetState(
  state: () => CngxAsyncState<unknown> | undefined,
): PresetStateContext {
  const i18n = inject(CNGX_CHART_I18N);
  const activeView = computed<AsyncView>(() => {
    const s = state();
    if (!s) {
      return 'content';
    }
    return resolveAsyncView(s.status(), s.isFirstLoad(), s.isEmpty());
  });
  return { i18n, activeView };
}
