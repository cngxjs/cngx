import type { TemplateRef } from '@angular/core';

import type { CngxAccordionItemIconContext } from '../accordion-item-icon.directive';
import type { CngxAccordionItemStateContext } from '../accordion-item-state-context';

/**
 * Selectable visual skin for `<cngx-accordion-group>`. \
 * The skin is a pure thematic concern - every value renders the identical
 * heading / region / marker structure, slots, ARIA, and keyboard behaviour, and
 * only redirects CSS via the `[data-skin]` host attribute. Typed class-sugar
 * (mirrors {@link CngxTabsSkin}), not a behaviour-branching mode flag.
 *
 * `'editorial'` mono index + hairlines; `'categorized'` bordered surface cards;
 * `'plus-minus'` one framed surface with a boxed +/- marker; `'lux'` generous
 * whitespace, large type; `'bento'` container-query card grid; `'section-bands'`
 * inverted full-width header bands; `'timeline'` a rail with per-item nodes;
 * `'severity-spine'` a full-height priority spine; `'data-grid'` a table layout;
 * `'split-meta'` title with trailing meta; `'primary-frame'` a solid primary
 * border + glow on open.
 *
 * @category ui/accordion
 * @since 0.1.0
 */
export type CngxAccordionSkin =
  | 'editorial'
  | 'categorized'
  | 'plus-minus'
  | 'lux'
  | 'bento'
  | 'section-bands'
  | 'timeline'
  | 'severity-spine'
  | 'data-grid'
  | 'split-meta'
  | 'primary-frame';

/**
 * App-wide cascade for the accordion organism's locale-sensitive
 * `disabledReason` string, the default heading level, and app-wide slot
 * templates.
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
   * Message announced (via a `role="alert"`) when an item's `[state]` is error
   * and no `*cngxAccordionItemError` slot is provided. English default; a
   * per-instance `[errorMessage]` or the error slot still wins. Ships a spoken
   * default so the error state is never silent to assistive tech (Pillar 2).
   */
  readonly errorMessage: string;
  /**
   * Default `aria-level` (2-6) every `CngxAccordionGroup` heading wrapper
   * reflects when `[headingLevel]` is not bound. Clamped into the ARIA range by
   * the group.
   */
  readonly headingLevel: number;
  /**
   * App-wide default visual skin reflected onto `[data-skin]`. Unset by default
   * (the base flat look). A per-instance `[skin]` Input still wins; this only
   * moves the cascade default. Override via {@link withAccordionSkin}.
   */
  readonly skin?: CngxAccordionSkin;
  /**
   * App-wide slot templates - the third tier of the slot cascade
   * (`*cngxAccordionItemXxx` per-instance -> this -> CSS default). Only slots
   * with a plausible app-wide default carry a config tier: the chevron, the busy
   * spinner, and the error affordance all have a design-system default; title
   * and body are per-item content with no meaningful app-wide default, so they
   * get no config tier.
   */
  readonly templates?: {
    /** App-wide chevron override; `$implicit` is the item's expanded state. */
    readonly icon?: TemplateRef<CngxAccordionItemIconContext> | null;
    /**
     * App-wide busy visual, rendered while an item's `[state]` is
     * loading/refreshing. Receives a {@link CngxAccordionItemStateContext}
     * (`$implicit` is the status).
     */
    readonly busySpinner?: TemplateRef<CngxAccordionItemStateContext> | null;
    /**
     * App-wide error affordance, rendered while an item's `[state]` is error.
     * Receives a {@link CngxAccordionItemStateContext} (`message` is the
     * resolved error string).
     */
    readonly error?: TemplateRef<CngxAccordionItemStateContext> | null;
  };
}
