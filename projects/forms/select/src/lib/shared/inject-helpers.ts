import { inject } from '@angular/core';

import { CngxSelectAnnouncer } from './announcer';
import { resolveSelectConfig } from './resolve-config';

/**
 * Resolve the effective Select config for the current injector, merged with
 * library defaults. Equivalent to
 * `inject(CNGX_SELECT_CONFIG, { optional: true })` but returns a fully
 * populated object — never `null`, no partials.
 *
 * Must be called in an injection context (constructor, field initializer,
 * or `runInInjectionContext`).
 *
 * @example
 * ```ts
 * import { injectSelectConfig } from '@cngx/forms/select';
 *
 * export class MyComposite {
 *   private readonly config = injectSelectConfig();
 *   protected readonly panelWidth = this.config.panelWidth;
 * }
 * ```
 *
 * @category interactive
 */
export function injectSelectConfig(): ReturnType<typeof resolveSelectConfig> {
  return resolveSelectConfig();
}

/**
 * Obtain the root-scoped {@link CngxSelectAnnouncer} used by every select
 * family component to announce selection changes to assistive tech.
 *
 * Useful if you're building a select-like composite and want to announce
 * custom events through the same live region.
 *
 * @example
 * ```ts
 * const announcer = injectSelectAnnouncer();
 * announcer.announce('Filter applied: Red', 'polite');
 * ```
 *
 * @category interactive
 */
export function injectSelectAnnouncer(): CngxSelectAnnouncer {
  return inject(CngxSelectAnnouncer);
}
