import {
  computed,
  inject,
  type Signal,
  type TemplateRef,
} from '@angular/core';

import { CNGX_SELECT_CONFIG, type CngxSelectConfig } from '../config';

/**
 * Directive shape for {@link injectResolvedTemplate}. Every `*cngxSelect*`
 * slot directive conforms; only `.templateRef` is read.
 *
 * @internal
 */
interface TemplateRefHolder<Ctx> {
  readonly templateRef: TemplateRef<Ctx>;
}

/** Keys into `CngxSelectConfig.templates`. @internal */
type TemplateKey = keyof NonNullable<CngxSelectConfig['templates']>;

/**
 * 3-stage template cascade: instance directive → config global → null.
 * `contentChild` must stay at the call site (Angular constraint). The
 * signal goes in, the resolved cascade comes out. Injection context
 * required.
 *
 * ```ts
 * protected readonly checkTpl = injectResolvedTemplate(
 *   contentChild<CngxSelectCheck<T>>(CngxSelectCheck),
 *   'check',
 * );
 * ```
 *
 * @internal
 */
export function injectResolvedTemplate<Ctx>(
  directive: Signal<TemplateRefHolder<Ctx> | undefined>,
  configKey: TemplateKey,
): Signal<TemplateRef<Ctx> | null> {
  const config = inject(CNGX_SELECT_CONFIG, { optional: true });
  return computed<TemplateRef<Ctx> | null>(() => {
    const instance = directive()?.templateRef;
    if (instance) {
      return instance;
    }
    const global = config?.templates?.[configKey] as
      | TemplateRef<Ctx>
      | null
      | undefined;
    return global ?? null;
  });
}

/**
 * @deprecated Use {@link injectResolvedTemplate}. Zero-cost re-export.
 * @internal
 */
export const resolveTemplate = injectResolvedTemplate;
