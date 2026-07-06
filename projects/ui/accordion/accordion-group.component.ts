import {
  ChangeDetectionStrategy,
  Component,
  input,
  ViewEncapsulation,
} from '@angular/core';

import { coerceNumberProperty } from '@cngx/core/utils';
import { CngxAccordion } from '@cngx/common/interactive';

import { CNGX_ACCORDION_GROUP, type CngxAccordionGroupContext } from './accordion-group.token';

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
  /**
   * Heading level (2-6, default 3) every item's `role="heading"` wrapper
   * reflects via `aria-level`. Clamped into the valid ARIA range so a stray
   * `0`/`9` can never emit an invalid `aria-level`. Coerced from string via
   * `coerceNumberProperty` for template attribute binding.
   */
  readonly headingLevel = input(3, {
    transform: (value: number | string) =>
      Math.min(6, Math.max(2, coerceNumberProperty(value, 3))),
  });
}
