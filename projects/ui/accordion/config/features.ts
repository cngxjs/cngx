import type { CngxAccordionConfigFeature } from './provide-accordion-config';

/**
 * Override the accordion's locale-sensitive `disabledReason` string - the text
 * announced to assistive tech when an item is disabled. Per-instance
 * `[disabledReason]` still wins over the cascade; this only sets the fallback.
 *
 * ```ts
 * provideAccordionConfig(
 *   withAccordionLabels({ disabledReason: 'This section is locked.' }),
 * );
 * ```
 *
 * @category ui/accordion
 * @since 0.1.0
 */
export function withAccordionLabels(payload: { disabledReason: string }): CngxAccordionConfigFeature {
  return { kind: 'labels', payload };
}

/**
 * Override the default heading level (`aria-level`) a `CngxAccordionGroup`
 * applies when `[headingLevel]` is not bound. Per-instance `[headingLevel]`
 * still wins; the group clamps the resolved value into the ARIA 2-6 range.
 *
 * ```ts
 * provideAccordionConfig(withDefaultHeadingLevel(2));
 * ```
 *
 * @category ui/accordion
 * @since 0.1.0
 */
export function withDefaultHeadingLevel(headingLevel: number): CngxAccordionConfigFeature {
  return { kind: 'headingLevel', payload: { headingLevel } };
}
