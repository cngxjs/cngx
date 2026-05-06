import { signal } from '@angular/core';
import type { MatTab } from '@angular/material/tabs';

import type { CngxTabHandle } from '@cngx/common/tabs';

/**
 * Translates a Material `MatTab` into a cngx {@link CngxTabHandle}.
 *
 * Pure factory; no DI. Surfaces:
 *
 * - `id` — derived from `MatTab.ariaLabel ?? MatTab.textLabel ??
 *   fallbackIdSeed()`. Falls back to a generated id when neither
 *   label nor aria-label is provided.
 * - `label` / `disabled` — snapshot signals captured at registration
 *   time. Material consumers who toggle these inputs dynamically
 *   should re-trigger `contentChildren` (e.g. via `*ngIf` /
 *   `@if` over the tab itself) so the directive re-registers a
 *   fresh handle. This Phase-1 limitation matches Material's own
 *   minimal observability of `MatTab` input changes; tracked for
 *   future revision when a consumer surfaces a dynamic-label
 *   requirement.
 * - `errorAggregator` — defaulted to `signal(undefined)` (the
 *   instrumentation path does not bind cngx error-aggregation
 *   per `MatTab`; Material's own visual error surface stays
 *   authoritative).
 *
 * @category material-bridge
 */
export function createMatTabHandle(
  matTab: MatTab,
  _index: number,
  fallbackIdSeed: () => string,
): CngxTabHandle {
  const id = matTab.ariaLabel ?? matTab.textLabel ?? fallbackIdSeed();
  return {
    id,
    label: signal(matTab.textLabel),
    disabled: signal(matTab.disabled),
    errorAggregator: signal(undefined),
  };
}
