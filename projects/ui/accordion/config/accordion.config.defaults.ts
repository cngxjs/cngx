import { InjectionToken } from '@angular/core';

import type { CngxAccordionConfig } from './accordion.config';

/**
 * Library defaults for the accordion configuration cascade. English by default
 * per `feedback_en_default_locale`; locale overrides ride the
 * `withAccordionLabels` feature. The `disabledReason` string is byte-identical
 * to the per-instance input default the item shipped before the cascade, so an
 * un-configured consumer sees no change.
 *
 * Exported for intra-lib consumers (`provideAccordionConfig` merges with this
 * base) but **NOT** re-exported from `public-api.ts` - downstream consumers
 * reach the defaults via `inject(CNGX_ACCORDION_CONFIG)` so
 * `provideAccordionConfig` / `provideAccordionConfigAt` overrides take
 * precedence.
 *
 * @internal
 */
export const CNGX_ACCORDION_DEFAULTS: CngxAccordionConfig = {
  disabledReason: 'This section is currently unavailable.',
  headingLevel: 3,
};

/**
 * App-wide configuration cascade for the accordion organism. Resolves in
 * priority order:
 *
 *   1. Per-instance Input binding.
 *   2. `provideAccordionConfigAt(...)` in a parent component's `viewProviders`.
 *   3. `provideAccordionConfig(...)` at the application root.
 *   4. Library defaults (this token's `factory`).
 *
 * `providedIn: 'root'` with a default factory means consumers never need to
 * provide the token explicitly - `inject(CNGX_ACCORDION_CONFIG)` always
 * resolves. Consumers who want overrides call `provideAccordionConfig(...)` in
 * `bootstrapApplication` providers (root cascade) or
 * `provideAccordionConfigAt(...)` in a component's `viewProviders` (sub-tree
 * cascade).
 *
 * @category ui/accordion
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/accordion/config/accordion.config.defaults.ts
 * @since 0.1.0
 */
export const CNGX_ACCORDION_CONFIG = new InjectionToken<CngxAccordionConfig>('CNGX_ACCORDION_CONFIG', {
  providedIn: 'root',
  factory: () => CNGX_ACCORDION_DEFAULTS,
});
