import { inject } from '@angular/core';

import { CngxSelectAnnouncer } from './announcer';
import { resolveSelectConfig } from './internal/resolve-config';

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
