import { inject } from '@angular/core';

import type { CngxTagConfig } from './tag.config';
import { CNGX_TAG_CONFIG } from './tag.config.defaults';

/**
 * Convenience accessor for the tag-family configuration cascade.
 * Runs in injection context; resolves through the priority chain
 * (per-instance Input → `provideTagConfigAt` → `provideTagConfig`
 * → library defaults).
 *
 * Equivalent to `inject(CNGX_TAG_CONFIG)` — the helper exists so
 * consumers don't need to import the token directly. Mirrors
 * `injectSelectConfig` in `@cngx/forms/select`.
 *
 * @example
 * ```ts
 * export class MyDirective {
 *   private readonly cfg = injectTagConfig();
 *   readonly variant = input<CngxTagVariant>(
 *     this.cfg.defaults?.variant ?? 'filled',
 *   );
 * }
 * ```
 *
 * @category display
 */
export function injectTagConfig(): CngxTagConfig {
  return inject(CNGX_TAG_CONFIG);
}
