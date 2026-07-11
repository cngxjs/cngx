import type { CngxAccordionConfig, CngxAccordionSkin } from './accordion.config';
import type { CngxAccordionConfigFeature } from './provide-accordion-config';

/**
 * Override the accordion's locale-sensitive announced strings - `disabledReason`
 * (spoken when an item is disabled) and `errorMessage` (spoken via `role="alert"`
 * when an item's `[state]` is error and no error slot is given). Pass either or
 * both. Per-instance `[disabledReason]` / `[errorMessage]` still win over the
 * cascade; this only sets the fallback.
 *
 * ```ts
 * provideAccordionConfig(
 *   withAccordionLabels({
 *     disabledReason: 'This section is locked.',
 *     errorMessage: 'This section failed to load.',
 *   }),
 * );
 * ```
 *
 * @category ui/accordion
 * @since 0.1.0
 */
export function withAccordionLabels(payload: {
  disabledReason?: string;
  errorMessage?: string;
}): CngxAccordionConfigFeature {
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
 * Set the app-wide default visual skin for `<cngx-accordion-group>`. Unset by
 * default (the base flat look). Per-instance `[skin]` Input still wins; this
 * moves the cascade default. Structure, slots, ARIA, and keyboard behaviour are
 * identical across skins - only the `[data-skin]` host attribute changes the
 * CSS. Typed class-sugar, not a mode flag.
 *
 * ```ts
 * provideAccordionConfig(withAccordionSkin('categorized'));
 * ```
 *
 * @category ui/accordion
 * @since 0.1.0
 */
export function withAccordionSkin(skin: CngxAccordionSkin): CngxAccordionConfigFeature {
  return { kind: 'skin', payload: { skin } };
}

/**
 * Set app-wide slot templates - the config tier of the slot cascade
 * (`*cngxAccordionItemXxx` per-instance -> this -> CSS default). Three slots
 * carry a config tier: `icon` (chevron; `$implicit` is the item's expanded
 * state), `busySpinner` (loading/refreshing visual), and `error` (error
 * affordance). Hand a `TemplateRef` per key here and every item renders it
 * unless a per-instance slot overrides it. Partial payloads compose - repeated
 * calls merge per key.
 *
 * ```ts
 * provideAccordionConfig(
 *   withAccordionTemplates({ icon: myChevronTpl, busySpinner: mySpinnerTpl }),
 * );
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
