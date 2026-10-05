import { inject, type Signal } from '@angular/core';

import { resolveActionSelectConfig } from './action-select-config';
import { CngxSelectAnnouncer } from './announcer';
import type { CngxSelectAriaLabels, CngxSelectFallbackLabels } from './config';
import { injectSelectConfigSource, resolveSelectConfig } from './internal/resolve-config';
import { resolveSelectLabels } from './internal/resolve-labels';
import { resolveReorderableSelectConfig } from './reorderable-select-config';

/**
 * Effective select config for the current injector, merged with library
 * defaults. Always fully populated - never `null`. Injection context required.
 *
 * ```ts
 * import { injectSelectConfig } from '@cngx/forms/select';
 *
 * export class MyComposite {
 *   private readonly config = injectSelectConfig();
 *   protected readonly panelWidth = this.config.panelWidth;
 * }
 * ```
 *
 * @category forms/select
 */
export function injectSelectConfig(): ReturnType<typeof resolveSelectConfig> {
  return resolveSelectConfig();
}

/**
 * The resolved select-family copy returned by {@link injectSelectLabels}.
 * Each key is a `Signal` with every library-defaulted key filled.
 *
 * @category forms/select
 * @since 0.1.0
 */
export interface CngxSelectLabels {
  /**
   * The ARIA labels. `clearButton` stays optional: its default differs per
   * variant and is filled by the component that renders the button.
   */
  readonly ariaLabels: Signal<
    CngxSelectAriaLabels & Required<Omit<CngxSelectAriaLabels, 'clearButton'>>
  >;
  /** The visible fallback copy (empty, loading, error states, the `+N` badge). */
  readonly fallbackLabels: Signal<Required<CngxSelectFallbackLabels>>;
}

/**
 * Reads the select-family copy the selects under this injector render and
 * announce: the `withAriaLabels` / `withFallbackLabels` overrides of the
 * nearest `CNGX_SELECT_CONFIG` (`provideSelectConfig` or
 * `provideSelectConfigAt`) over the `select` section of the active language
 * pack (English without one), formatted for the locale of the reading
 * injector. A key the config leaves unset, `null` or `undefined` reads the
 * section; a `provideLocaleAt` subtree formats its numbers in that locale.
 *
 * Same resolution path as the select components, so a custom composite next
 * to them shows the same words. Read the signals inside a `computed()`, a
 * template or a handler, never at construction, so a runtime language switch
 * reaches them. Injection context required.
 *
 * ```ts
 * export class AppTagSummary {
 *   private readonly labels = injectSelectLabels();
 *   protected readonly badge = computed(() =>
 *     this.labels.fallbackLabels().chipOverflowBadge(this.hidden()),
 *   );
 * }
 * ```
 *
 * @category forms/select
 * @since 0.1.0
 * @relatedTo injectSelectConfig, withAriaLabels, withFallbackLabels, provideSelectConfig, provideSelectConfigAt
 */
export function injectSelectLabels(): CngxSelectLabels {
  const { ariaLabels, fallbackLabels } = resolveSelectLabels(injectSelectConfigSource());
  return { ariaLabels, fallbackLabels };
}

/**
 * Root-scoped {@link CngxSelectAnnouncer} for custom composites that want to
 * share the family live-region.
 *
 * ```ts
 * const announcer = injectSelectAnnouncer();
 * announcer.announce('Filter applied: Red', 'polite');
 * ```
 *
 * @category forms/select
 */
export function injectSelectAnnouncer(): CngxSelectAnnouncer {
  return inject(CngxSelectAnnouncer);
}

/**
 * Effective action-select config for the current injector, merged with
 * library defaults. Always fully populated - never `null`. Injection
 * context required. Sibling of {@link injectSelectConfig} for the
 * `CngxActionSelect` / `CngxActionMultiSelect` composites.
 *
 * @category forms/select
 */
export function injectActionSelectConfig(): ReturnType<typeof resolveActionSelectConfig> {
  return resolveActionSelectConfig();
}

/**
 * Effective reorderable-select config for the current injector, merged
 * with library defaults. Always fully populated - never `null`. Injection
 * context required. Sibling of {@link injectSelectConfig} for the
 * `CngxReorderableMultiSelect` composite.
 *
 * @category forms/select
 */
export function injectReorderableSelectConfig(): ReturnType<
  typeof resolveReorderableSelectConfig
> {
  return resolveReorderableSelectConfig();
}
