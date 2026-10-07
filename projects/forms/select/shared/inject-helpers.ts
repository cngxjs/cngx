import { inject } from '@angular/core';

import { resolveActionSelectConfig } from './action-select-config';
import { CngxSelectAnnouncer } from './announcer';
import { resolveSelectConfig } from './internal/resolve-config';
import { resolveReorderableSelectConfig } from './reorderable-select-config';

/**
 * Effective select config for the current injector, merged with library
 * defaults. Always fully populated - never `null`. Injection context required.
 *
 * The copy keys `ariaLabels` and `fallbackLabels` are signals carrying the
 * same words the select components render and announce: the
 * `withAriaLabels` / `withFallbackLabels` overrides of the nearest
 * `CNGX_SELECT_CONFIG` over the `select` section of the active language pack
 * (English without one), formatted for the locale of the reading injector. A
 * runtime language switch and a `provideLocaleAt` subtree both reach them, so
 * a custom composite next to the selects shows the same copy. Read them
 * inside a `computed()`, a template or a handler, never at construction.
 *
 * ```ts
 * import { injectSelectConfig } from '@cngx/forms/select';
 *
 * export class MyComposite {
 *   private readonly config = injectSelectConfig();
 *   protected readonly panelWidth = this.config.panelWidth;
 *   protected readonly badge = computed(() =>
 *     this.config.fallbackLabels().chipOverflowBadge(this.hidden()),
 *   );
 * }
 * ```
 *
 * @category forms/select
 */
export function injectSelectConfig(): ReturnType<typeof resolveSelectConfig> {
  return resolveSelectConfig();
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
