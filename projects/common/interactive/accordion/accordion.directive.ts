import { Directive, inject, input, signal } from '@angular/core';
import { CngxRovingTabindex } from '@cngx/common/a11y';
import { setEqual } from '@cngx/utils';

import { CNGX_ACCORDION, type CngxAccordionHost } from './accordion.token';

/**
 * Coordinating directive for an accordion: it packages the
 * `CngxExpandable + CngxRovingTabindex + aria-expanded` pattern that consumers
 * otherwise hand-wire. Put `cngxAccordion` on the container; each header
 * carries {@link CngxAccordionPanel}. The container owns the single source of
 * truth - one `openIds` set signal - and arbitrates single- vs multi-open. No
 * panel owns mutable expansion state and no effect syncs siblings: every
 * panel's `aria-expanded` derives from this one signal (Pillar 1).
 *
 * Header arrow-key navigation comes from the `CngxRovingTabindex` host
 * directive (pinned to the vertical axis). Because it discovers items via
 * non-descendant `contentChildren`, the `cngxAccordionPanel` header buttons
 * must be direct children of the `cngxAccordion` element.
 *
 * ```html
 * <div cngxAccordion #acc="cngxAccordion" [multi]="false">
 *   <button cngxAccordionPanel panelId="a" controls="region-a">Section A</button>
 *   <div role="region" id="region-a" [hidden]="!acc.isOpen('a')">…</div>
 *   <button cngxAccordionPanel panelId="b" controls="region-b">Section B</button>
 *   <div role="region" id="region-b" [hidden]="!acc.isOpen('b')">…</div>
 * </div>
 * ```
 *
 * @category common/interactive/accordion
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/accordion/accordion.directive.ts
 * @since 0.1.0
 * @relatedTo CngxAccordionPanel, CngxExpandable, CngxRovingTabindex
 */
@Directive({
  selector: '[cngxAccordion]',
  exportAs: 'cngxAccordion',
  standalone: true,
  hostDirectives: [CngxRovingTabindex],
  providers: [{ provide: CNGX_ACCORDION, useExisting: CngxAccordion }],
  host: {
    '[attr.aria-multiselectable]': 'multi() ? "true" : null',
  },
})
export class CngxAccordion implements CngxAccordionHost {
  /** Whether more than one panel may stay open at once. */
  readonly multi = input<boolean>(false);

  // Single source of truth for which panels are open. `setEqual` guards the
  // collection return so an identical set never re-fires downstream computeds.
  private readonly openIds = signal<ReadonlySet<string>>(new Set(), { equal: setEqual });

  constructor() {
    // Accordion headers navigate vertically; the roving host defaults to the
    // horizontal axis, so pin it for the WAI-ARIA accordion pattern.
    inject(CngxRovingTabindex, { host: true }).orientation.set('vertical');
  }

  isOpen(panelId: string): boolean {
    return this.openIds().has(panelId);
  }

  toggle(panelId: string): void {
    const open = this.openIds();
    // Single mode collapses every sibling by seeding an empty set; multi mode
    // preserves the others. Either way the coordinator is the only writer.
    const next = new Set<string>(this.multi() ? open : []);
    if (open.has(panelId)) {
      next.delete(panelId);
    } else {
      next.add(panelId);
    }
    this.openIds.set(next);
  }
}
