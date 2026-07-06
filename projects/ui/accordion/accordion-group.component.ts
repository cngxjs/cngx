import {
  ChangeDetectionStrategy,
  Component,
  input,
  ViewEncapsulation,
} from '@angular/core';

import { coerceNumberProperty } from '@cngx/core/utils';
import { CngxAccordion } from '@cngx/common/interactive';

import { CNGX_ACCORDION_GROUP, type CngxAccordionGroupContext } from './accordion-group.token';
import { injectAccordionConfig } from './config/inject-accordion-config';

/**
 * Accordion organism shell. Hosts the headless {@link CngxAccordion} brain via
 * `hostDirectives` - so `CNGX_ACCORDION` and the registration keyboard-nav come
 * with it - forwards `[multi]` and the controlled `[(openIds)]` model, and adds
 * `[headingLevel]`. Projects its
 * `CngxAccordionItem` children through a single `<ng-content />`; the group
 * owns no rendering beyond providing {@link CNGX_ACCORDION_GROUP} so items read
 * the shared heading level.
 *
 * ```html
 * <cngx-accordion-group [multi]="false" [headingLevel]="3">
 *   <cngx-accordion-item>
 *     <span cngxAccordionItemTitle>Section A</span>
 *     Body A
 *   </cngx-accordion-item>
 * </cngx-accordion-group>
 * ```
 *
 * @category ui/accordion
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/accordion/accordion-group.component.ts
 * @since 0.1.0
 * @relatedTo CngxAccordionItem, CngxAccordion, createAccordionKeyboardNav
 */
@Component({
  selector: 'cngx-accordion-group',
  exportAs: 'cngxAccordionGroup',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './accordion-group.component.css',
  hostDirectives: [
    { directive: CngxAccordion, inputs: ['multi', 'openIds'], outputs: ['openIdsChange'] },
  ],
  providers: [{ provide: CNGX_ACCORDION_GROUP, useExisting: CngxAccordionGroup }],
  template: '<ng-content />',
  host: {
    class: 'cngx-accordion-group',
  },
})
export class CngxAccordionGroup implements CngxAccordionGroupContext {
  // Config cascade source. Declared first so the headingLevel input default and
  // its coerce fallback below can read the resolved value.
  private readonly config = injectAccordionConfig();

  /**
   * Heading level (2-6) every item's `role="heading"` wrapper reflects via
   * `aria-level`. Resolves `input ?? CNGX_ACCORDION_CONFIG.headingLevel ?? 3`:
   * an unbound `[headingLevel]` falls back to the app-wide config default
   * (overridden via `withDefaultHeadingLevel`). Clamped into the valid ARIA
   * range so a stray `0`/`9` - from a binding OR the config default - can never
   * emit an invalid `aria-level`. The default is clamped explicitly because
   * Angular runs `transform` only on bound values, not the initial default.
   * Coerced from string via `coerceNumberProperty` for template attribute binding.
   */
  readonly headingLevel = input(clampHeadingLevel(this.config.headingLevel), {
    transform: (value: number | string) => clampHeadingLevel(value, this.config.headingLevel),
  });
}

/**
 * Coerce a bound value to a number (via `coerceNumberProperty`, falling back to
 * `fallback`) and clamp it into the ARIA heading-level range 2-6.
 */
function clampHeadingLevel(value: number | string, fallback = 3): number {
  return Math.min(6, Math.max(2, coerceNumberProperty(value, fallback)));
}
