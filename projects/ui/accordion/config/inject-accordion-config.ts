import { computed, inject, isSignal, type Signal } from '@angular/core';
import { recordEqual } from '@cngx/utils';

import { injectAccordionSiteCopy } from '../i18n/accordion-i18n';
import type { CngxAccordionLanguageSection } from '../i18n/accordion-language-section';
import type { CngxAccordionConfig } from './accordion.config';
import { CNGX_ACCORDION_CONFIG } from './accordion.config.defaults';

/**
 * Convenience accessor for the accordion configuration cascade. Runs in
 * injection context; resolves through the priority chain (per-instance Input
 * -> `provideAccordionConfigAt` -> `provideAccordionConfig` -> library
 * defaults). Equivalent to `inject(CNGX_ACCORDION_CONFIG)` - the helper exists
 * so consumers don't import the token directly. Mirrors `injectBreadcrumbConfig`
 * in `@cngx/ui/breadcrumb`.
 *
 * The copy keys `disabledReason` and `errorMessage` may hold a `Signal`; wrap
 * one with `coerceSignal` from `@cngx/core/utils` and read it inside a
 * `computed()`, a template or a handler.
 *
 * ```ts
 * export class MyAccordionReason {
 *   private readonly reason = coerceSignal(injectAccordionConfig().disabledReason);
 *   protected readonly text = computed(() => this.reason());
 * }
 * ```
 *
 * @category ui/accordion
 * @since 0.1.0
 */
export function injectAccordionConfig(): CngxAccordionConfig {
  return inject(CNGX_ACCORDION_CONFIG);
}

/**
 * The accordion config with its copy keys resolved to plain strings.
 *
 * @internal
 */
export type CngxAccordionResolvedConfig = CngxAccordionConfig & {
  readonly disabledReason: string;
  readonly errorMessage: string;
};

const valueOf = <T>(source: T | Signal<T>): T => (isSignal(source) ? source() : source);

const RESOLVED_COPY = new WeakMap<
  Signal<CngxAccordionLanguageSection>,
  WeakMap<CngxAccordionConfig, Signal<CngxAccordionResolvedConfig>>
>();

/**
 * The config with `disabledReason` / `errorMessage` read through, as a Signal
 * that follows a runtime language switch. A key the config leaves unset reads
 * the `accordion` section of the active pack. Memoized per site section and
 * config object, so every item under one cascade shares one `computed()`.
 * Injection context required.
 *
 * @internal
 */
export function resolveAccordionCopy(
  config: CngxAccordionConfig,
): Signal<CngxAccordionResolvedConfig> {
  const site = injectAccordionSiteCopy();
  let byConfig = RESOLVED_COPY.get(site);
  if (!byConfig) {
    byConfig = new WeakMap();
    RESOLVED_COPY.set(site, byConfig);
  }
  const cached = byConfig.get(config);
  if (cached) {
    return cached;
  }
  const copy = computed<CngxAccordionResolvedConfig>(
    () => {
      const section = site();
      return {
        ...config,
        disabledReason: valueOf(config.disabledReason) ?? section.disabledReason,
        errorMessage: valueOf(config.errorMessage) ?? section.errorMessage,
      };
    },
    { equal: recordEqual },
  );
  byConfig.set(config, copy);
  return copy;
}
