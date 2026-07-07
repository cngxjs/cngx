import type { CngxAccordionConfig } from './accordion.config';
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

/**
 * Set app-wide slot templates - the config tier of the slot cascade. Only the
 * chevron (`icon`) carries a config tier: hand one `TemplateRef` here (query it
 * once in the app root) and every accordion item renders it unless a per-item
 * `*cngxAccordionItemIcon` overrides it. `$implicit` in the template is the
 * item's expanded state.
 *
 * ```ts
 * provideAccordionConfig(withAccordionTemplates({ icon: myChevronTpl }));
 * ```
 *
 * @category ui/accordion
 * @since 0.1.0
 */
export function withAccordionTemplates(
  payload: NonNullable<CngxAccordionConfig['templates']>,
): CngxAccordionConfigFeature {
  return { kind: 'templates', payload };
}

/**
 * Set the app-wide busy visual - the config tier of the busy-slot cascade
 * (`*cngxAccordionItemBusy` per-instance -> this -> CSS skeleton default). Every
 * item whose `[state]` is loading or refreshing renders it unless a per-item
 * slot overrides it. A design system sets one spinner for every accordion here.
 *
 * ```ts
 * provideAccordionConfig(withAccordionBusySpinnerTemplate(mySpinnerTpl));
 * ```
 *
 * @category ui/accordion
 * @since 0.1.0
 */
export function withAccordionBusySpinnerTemplate(
  busySpinner: NonNullable<CngxAccordionConfig['templates']>['busySpinner'],
): CngxAccordionConfigFeature {
  return { kind: 'templates', payload: { busySpinner } };
}

/**
 * Set the app-wide error affordance - the config tier of the error-slot cascade
 * (`*cngxAccordionItemError` per-instance -> this -> CSS error default). Every
 * item whose `[state]` is error renders it unless a per-item slot overrides it.
 *
 * ```ts
 * provideAccordionConfig(withAccordionErrorTemplate(myErrorTpl));
 * ```
 *
 * @category ui/accordion
 * @since 0.1.0
 */
export function withAccordionErrorTemplate(
  error: NonNullable<CngxAccordionConfig['templates']>['error'],
): CngxAccordionConfigFeature {
  return { kind: 'templates', payload: { error } };
}
