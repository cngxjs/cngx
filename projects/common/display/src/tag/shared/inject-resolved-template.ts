import { computed, inject, type Signal, type TemplateRef } from '@angular/core';

import { CNGX_TAG_CONFIG } from '../config/tag.config.defaults';

/**
 * Keys into the upcoming `CngxTagConfig.templates` cascade. Phase 2
 * adds the `CngxTagGroup`-side keys (`'header'`, `'accessory'`);
 * Phase 4 commit 5 narrows the union to
 * `keyof CngxTagConfig['templates']` once the config interface
 * ships. Keeping the union tight to the keys actually passed at
 * current call sites prevents typos (e.g. passing an unwired key)
 * from going unnoticed until the corresponding phase merges.
 *
 * @internal
 */
export type CngxTagTemplateKey =
  | 'label'
  | 'prefix'
  | 'suffix'
  | 'header'
  | 'accessory';

/**
 * Directive shape accepted by {@link injectResolvedTagTemplate}.
 * Every `*cngxTag*` template-slot directive in `@cngx/common/display`
 * conforms — the helper only looks at `.templateRef`.
 *
 * @internal
 */
interface TagTemplateRefHolder<Ctx> {
  readonly templateRef: TemplateRef<Ctx>;
}

/**
 * Wraps a `contentChild` directive query in a 3-stage slot-resolution
 * cascade:
 *
 *   1. Instance directive (highest) — consumer-projected
 *      `<ng-template cngxTag*>` template.
 *   2. `CNGX_TAG_CONFIG.templates[<key>]` (app-wide cascade via
 *      `provideTagConfig` / `provideTagConfigAt`).
 *   3. `null` (the host's default `<ng-template>` body wins, e.g.
 *      `CngxTag`'s `<span class="cngx-tag__label"><ng-content /></span>`
 *      label fallback).
 *
 * `inject(CNGX_TAG_CONFIG, { optional: true })` mirrors the select-
 * shared helper exactly — `providedIn: 'root'` always resolves so
 * the optional flag is defensive, not load-bearing.
 *
 * **Why a copy and not an import from `@cngx/forms/select/shared`.**
 * Sheriff blocks `lib:common-display` from importing
 * `lib:forms-select`. Hoisting the helper to `@cngx/core/utils`
 * would let both libs share it, but that refactor touches every
 * select call site and belongs in a separate utils-consolidation
 * plan (see
 * `.internal/architektur/plans/tag-family-architectural-a-plus-pass-plan.md`,
 * "Architectural decisions (locked)" — `injectResolvedTemplate
 * location` row).
 *
 * @internal
 */
export function injectResolvedTagTemplate<Ctx>(
  directive: Signal<TagTemplateRefHolder<Ctx> | undefined>,
  configKey: CngxTagTemplateKey,
): Signal<TemplateRef<Ctx> | null> {
  const config = inject(CNGX_TAG_CONFIG, { optional: true });
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
