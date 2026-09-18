import { inject } from '@angular/core';

import { resolveActionSelectConfig } from './action-select-config';
import { CngxSelectAnnouncer } from './announcer';
import { resolveSelectConfig } from './internal/resolve-config';
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
