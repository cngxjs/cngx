import { computed, Directive, inject, input } from '@angular/core';
import { CngxRovingItem } from '@cngx/common/a11y';

import { CNGX_ACCORDION } from './accordion.token';

/**
 * Accordion header. Put `cngxAccordionPanel` on the header `<button>` (a direct
 * child of `cngxAccordion`); the directive mirrors `aria-expanded` from the
 * coordinator, points `aria-controls` at the region, and toggles the panel on
 * click. The `CngxRovingItem` host directive joins it to the container's
 * vertical arrow-key navigation.
 *
 * Expansion state is never owned here: `aria-expanded` is a `computed()` over
 * the coordinator's open-set, so single-open arbitration is pure derivation,
 * not sibling syncing (Pillar 1). Use a native `<button>` so Enter / Space
 * activate it through the browser's own click synthesis.
 *
 * @category common/interactive/accordion
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/accordion/accordion-panel.directive.ts
 * @since 0.1.0
 * @relatedTo CngxAccordion, CngxRovingItem
 */
@Directive({
  selector: '[cngxAccordionPanel]',
  exportAs: 'cngxAccordionPanel',
  standalone: true,
  hostDirectives: [CngxRovingItem],
  host: {
    '[attr.aria-expanded]': 'expanded()',
    '[attr.aria-controls]': 'controls() ?? null',
    '(click)': 'toggle()',
  },
})
export class CngxAccordionPanel {
  /** Stable id identifying this panel within its accordion. */
  readonly panelId = input.required<string>();
  /** `id` of the region this header controls, bound to `aria-controls`. */
  readonly controls = input<string | undefined>(undefined);

  private readonly accordion = inject(CNGX_ACCORDION);

  /** `aria-expanded`, derived from the coordinator's open-set. */
  protected readonly expanded = computed(() => this.accordion.isOpen(this.panelId()));

  protected toggle(): void {
    this.accordion.toggle(this.panelId());
  }
}
