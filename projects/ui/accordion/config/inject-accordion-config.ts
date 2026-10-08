import { computed, inject, isSignal, type Signal } from '@angular/core';
import { createFilledOverrideMerge } from '@cngx/core/utils';
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
 * The copy keys `disabledReason` and `errorMessage` hold overrides only; read
 * the resolved copy (overrides over the language pack) through
 * {@link injectAccordionLabels}.
 *
 * @category ui/accordion
 * @since 0.1.0
 */
export function injectAccordionConfig(): CngxAccordionConfig {
  return inject(CNGX_ACCORDION_CONFIG);
}

const valueOf = <T>(source: T | Signal<T>): T => (isSignal(source) ? source() : source);

const CONFIG_COPY = new WeakMap<
  CngxAccordionConfig,
  Signal<Partial<CngxAccordionLanguageSection>>
>();

/**
 * The copy keys a config sets, each unwrapped, as one Signal. Memoized per
 * config object so every item under one cascade shares it.
 *
 * @internal
 */
function accordionConfigCopy(
  config: CngxAccordionConfig,
): Signal<Partial<CngxAccordionLanguageSection>> {
  let copy = CONFIG_COPY.get(config);
  if (!copy) {
    copy = computed(
      () => ({
        disabledReason: valueOf(config.disabledReason),
        errorMessage: valueOf(config.errorMessage),
      }),
      { equal: recordEqual },
    );
    CONFIG_COPY.set(config, copy);
  }
  return copy;
}

/**
 * The accordion copy in scope - `disabledReason` and `errorMessage` - as a
 * Signal that follows a runtime language switch. A key the config sets wins;
 * a key it leaves unset, `null` or `undefined` reads the `accordion` section
 * of the active pack (English without one). Runs in injection context; read it
 * inside a `computed()`, a template or a handler, and untracked where it
 * builds live-region text.
 *
 * ```ts
 * export class MyAccordionReason {
 *   private readonly copy = injectAccordionLabels();
 *   protected readonly reason = computed(() => this.copy().disabledReason);
 * }
 * ```
 *
 * @category ui/accordion
 * @since 0.1.0
 */
export function injectAccordionLabels(): Signal<CngxAccordionLanguageSection> {
  return createFilledOverrideMerge(
    injectAccordionSiteCopy(),
    accordionConfigCopy(injectAccordionConfig()),
  );
}
