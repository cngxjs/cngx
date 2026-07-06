import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';

import { nextUid } from '@cngx/core/utils';
import { CNGX_ACCORDION, CngxAccordionPanel } from '@cngx/common/interactive';

import { CNGX_ACCORDION_GROUP } from './accordion-group.token';

/**
 * Accordion item organism. Renders the APG-correct trio a headless consumer
 * otherwise hand-wires: a `role="heading"` wrapper carrying the group's
 * `aria-level`, a `cngxAccordionPanel` header `<button>`, and a
 * `role="region"` named back at the header via `aria-labelledby`. Expansion is
 * derived from the coordinator (Pillar 1); the header self-wires keyboard nav
 * through the registration brain, so arrow keys rove across items even though
 * each header lives in its own component view.
 *
 * A disabled item renders a visually-hidden reason element with a stable id
 * that `aria-describedby` always points at (IDREF never dangles); only the
 * element's `aria-hidden` and text toggle with `disabled()`.
 *
 * @category ui/accordion
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/accordion/accordion-item.component.ts
 * @since 0.1.0
 * @relatedTo CngxAccordionGroup, CngxAccordionPanel
 */
@Component({
  selector: 'cngx-accordion-item',
  exportAs: 'cngxAccordionItem',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [CngxAccordionPanel],
  templateUrl: './accordion-item.component.html',
  styleUrl: './accordion-item.component.css',
  host: {
    class: 'cngx-accordion-item',
    '[attr.data-expanded]': "expanded() ? '' : null",
  },
})
export class CngxAccordionItem {
  /**
   * Disabled item: the header reports `tabindex="-1"` + `aria-disabled="true"`,
   * is skipped by roving, and its click never expands. The reason text is
   * announced through {@link disabledReason} via `aria-describedby`.
   */
  readonly disabled = input<boolean>(false);
  /**
   * Reason announced to assistive tech when the item is disabled, bound
   * through the always-present `aria-describedby` reason element. English
   * default; consumers override for locale or a specific explanation.
   */
  readonly disabledReason = input<string>('This section is currently unavailable.');

  private readonly accordion = inject(CNGX_ACCORDION);
  protected readonly group = inject(CNGX_ACCORDION_GROUP);

  protected readonly panelId = nextUid('cngx-accordion-panel-');
  protected readonly regionId = nextUid('cngx-accordion-region-');
  protected readonly headerId = nextUid('cngx-accordion-header-');
  protected readonly reasonId = nextUid('cngx-accordion-reason-');

  /** Whether this item's region is open, derived from the coordinator's open-set. */
  protected readonly expanded = computed(() => this.accordion.isOpen(this.panelId));
}
