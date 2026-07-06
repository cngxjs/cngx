/**
 * App-wide cascade for the accordion organism's locale-sensitive
 * `disabledReason` string and the default heading level.
 *
 * Resolution priority (high -> low):
 *   1. Per-instance Input binding (`[disabledReason]` / `[headingLevel]`).
 *   2. `provideAccordionConfigAt(...)` in a parent component's `viewProviders`
 *      (component-scoped override).
 *   3. `provideAccordionConfig(...)` at the application root.
 *   4. Library defaults (English; `CNGX_ACCORDION_DEFAULTS`).
 *
 * Both keys are required on the resolved config - the token ships a complete
 * default, and every `with*` feature overrides a whole key, so no consumer ever
 * observes a partial shape.
 *
 * @category ui/accordion
 * @since 0.1.0
 */
export interface CngxAccordionConfig {
  /**
   * Reason announced to assistive tech when an item is disabled, bound through
   * the item's always-present `aria-describedby` reason element. English
   * default; a per-instance `[disabledReason]` still wins over the cascade.
   */
  readonly disabledReason: string;
  /**
   * Default `aria-level` (2-6) every `CngxAccordionGroup` heading wrapper
   * reflects when `[headingLevel]` is not bound. Clamped into the ARIA range by
   * the group.
   */
  readonly headingLevel: number;
}
