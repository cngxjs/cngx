import { computed, type Signal, type TemplateRef } from '@angular/core';

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
 * Wraps a `contentChild` directive query in a slot-resolution
 * cascade.
 *
 * **Phase 1 (this commit):** 2-stage cascade — instance directive,
 * else `null`. The directive's host template owns the default
 * `<ng-template>` body that runs when this helper returns `null`.
 *
 * **Phase 4 commit 5:** expanded to 3-stage —
 *   1. Instance directive (highest).
 *   2. `CNGX_TAG_CONFIG.templates[<key>]` (app-wide cascade).
 *   3. `null` (host template default).
 *
 * The `configKey` parameter ships now so Phase 4 lands as a pure
 * semantic upgrade — call sites in `tag.directive.ts` and
 * `tag-group.component.ts` do not change between phases.
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
  // Phase 1 placeholder — `configKey` is consumed in Phase 4 commit 5
  // once `CNGX_TAG_CONFIG.templates[<key>]` becomes the second cascade
  // tier. Referenced via `void` so call-site stability holds across
  // phases without a per-line lint suppression that future edits would
  // drift around.
  void configKey;
  return computed<TemplateRef<Ctx> | null>(() => {
    const instance = directive()?.templateRef;
    return instance ?? null;
  });
}
