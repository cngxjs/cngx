import {
  computed,
  inject,
  type Signal,
  type TemplateRef,
} from '@angular/core';

import { CNGX_SELECT_CONFIG, type CngxSelectConfig } from './config';

/**
 * Directive shape accepted by {@link resolveTemplate}. Every
 * `*cngxSelect*` template-slot directive in `@cngx/forms/select`
 * conforms — the helper only looks at `.templateRef`.
 *
 * @internal
 */
interface TemplateRefHolder<Ctx> {
  readonly templateRef: TemplateRef<Ctx>;
}

/**
 * Keys into `CngxSelectConfig.templates` — used as the second
 * resolution stage.
 *
 * @internal
 */
type TemplateKey = keyof NonNullable<CngxSelectConfig['templates']>;

/**
 * Wraps a `contentChild` directive query in the 3-stage cascade:
 *
 *   1. Instance-level directive result (highest) — consumer-projected
 *      `*cngxSelect*` template.
 *   2. Global `CNGX_SELECT_CONFIG.templates[<key>]`.
 *   3. `null` (the component template falls back to a library default).
 *
 * **Why a helper.**
 * Before extraction, `CngxSelect` and `CngxMultiSelect` each declared
 * ~14 private `xxxDirective = contentChild(...)` queries plus ~14
 * `protected xxxTpl = computed(...)` cascade signals — ~80 LOC of
 * structurally-identical boilerplate per component. Passing the
 * `contentChild` signal through this helper halves the surface area
 * and locks the cascade semantic down to one implementation.
 *
 * **Why `contentChild` stays at the call site.**
 * Angular's `contentChild` is only valid in a class field initialiser
 * or constructor, not in a helper call. The signal goes IN; the
 * cascade comes OUT. `inject(CNGX_SELECT_CONFIG)` inside this helper
 * works because its caller (the component's field init) has an active
 * injection context.
 *
 * @example
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
 * Legacy name for {@link injectResolvedTemplate}. Kept as a re-export so
 * existing internal callers keep compiling; new call sites — including
 * the upcoming tree-select panel slots — should use the `inject*`
 * prefix that matches the rest of the cngx factory/injection surface
 * (`injectSelectConfig`, `injectSelectAnnouncer`, …).
 *
 * @deprecated Prefer `injectResolvedTemplate`. This alias is a
 * zero-cost re-export — same function, same semantics.
 * @internal
 */
export const resolveTemplate = injectResolvedTemplate;
