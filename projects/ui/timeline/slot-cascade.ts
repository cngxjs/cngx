import { computed, type Signal, type TemplateRef } from '@angular/core';

/** Anything a cngx slot directive exposes: its own `TemplateRef`. */
interface SlotDirective<C> {
  readonly templateRef: TemplateRef<C>;
}

/**
 * The family-standard three-stage template cascade, as one named concept:
 *
 * ```text
 * instance contentChild  ->  CNGX_*_CONFIG.templates.<key>  ->  null
 * ```
 *
 * The `contentChild()` query itself has to stay a direct field initialiser
 * on the component (AOT rejects it from a helper, NG8110), but resolving the
 * three tiers does not - and writing that resolution out once per slot turns
 * a single rule into seven places it can drift.
 *
 * `configured` is a thunk rather than a value so the config tier is read at
 * resolution time, inside the `computed()`.
 *
 * @internal
 */
export function resolveSlot<C>(
  instance: Signal<SlotDirective<C> | undefined>,
  configured: () => TemplateRef<C> | undefined,
): Signal<TemplateRef<C> | null> {
  return computed(() => instance()?.templateRef ?? configured() ?? null);
}
