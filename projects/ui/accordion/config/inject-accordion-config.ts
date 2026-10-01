import { computed, inject, isSignal, type Signal } from '@angular/core';
import { recordEqual } from '@cngx/utils';

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

const RESOLVED_COPY = new WeakMap<CngxAccordionConfig, Signal<CngxAccordionResolvedConfig>>();

/**
 * The config with `disabledReason` / `errorMessage` read through, as a Signal
 * that follows a runtime language switch. Memoized per config object, so every
 * item under one cascade shares one `computed()`.
 *
 * @internal
 */
export function resolveAccordionCopy(
  config: CngxAccordionConfig,
): Signal<CngxAccordionResolvedConfig> {
  const cached = RESOLVED_COPY.get(config);
  if (cached) {
    return cached;
  }
  const copy = computed<CngxAccordionResolvedConfig>(
    () => ({
      ...config,
      disabledReason: valueOf(config.disabledReason),
      errorMessage: valueOf(config.errorMessage),
    }),
    { equal: recordEqual },
  );
  RESOLVED_COPY.set(config, copy);
  return copy;
}
