import { Directive, ElementRef, inject, input, linkedSignal, signal } from '@angular/core';
import { setEqual } from '@cngx/utils';

import {
  createAccordionKeyboardNav,
  type CngxAccordionHeaderHandle,
  type CngxAccordionKeyboardNav,
} from './accordion-keyboard-nav';
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
  providers: [{ provide: CNGX_ACCORDION, useExisting: CngxAccordion }],
})
export class CngxAccordion implements CngxAccordionHost {
  /** Whether more than one panel may stay open at once. */
  readonly multi = input<boolean>(false);

  // Single source of truth for which panels are open. `setEqual` guards the
  // collection return so an identical set never re-fires downstream computeds.
  private readonly openIds = signal<ReadonlySet<string>>(new Set(), { equal: setEqual });

  // Header registry, keyed by handle identity. `headersEqual` is an
  // order-independent identity-set compare so a re-register of the same
  // handles never re-fires the roving derivation.
  private readonly headersState = signal<readonly CngxAccordionHeaderHandle[]>([], {
    equal: headersEqual,
  });
  readonly headers = this.headersState.asReadonly();

  /**
   * The group's single tab stop, derived-not-managed from the registry. When
   * the registry changes, keep the previous stop while it is still registered
   * and enabled, else fall back to the first enabled header. Never reset by an
   * unrelated header registering or unregistering (Pillar 1 preserve-then-
   * default); `setRovingActive` writes it directly for keyboard movement.
   */
  readonly rovingActiveId = linkedSignal<readonly CngxAccordionHeaderHandle[], string | null>({
    source: this.headers,
    computation: (headers, prev) =>
      headers.some((h) => h.id === prev?.value && !h.disabled())
        ? prev!.value
        : (headers.find((h) => !h.disabled())?.id ?? null),
  });

  private readonly hostElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  readonly nav: CngxAccordionKeyboardNav = createAccordionKeyboardNav({
    host: this,
    hostElement: this.hostElement,
  });

  registerHeader(handle: CngxAccordionHeaderHandle): void {
    this.headersState.update((headers) =>
      headers.includes(handle) ? headers : [...headers, handle],
    );
  }

  unregisterHeader(handle: CngxAccordionHeaderHandle): void {
    this.headersState.update((headers) => headers.filter((h) => h !== handle));
  }

  setRovingActive(id: string): void {
    this.rovingActiveId.set(id);
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

/**
 * Order-independent identity-set equality for the header registry. Two arrays
 * are equal when they hold the same handle references, regardless of
 * registration order. Handles are stable per panel (carrying `disabled` by
 * signal reference), so a disabled toggle never changes the set - the roving
 * derivation only re-runs when a header actually joins or leaves.
 */
function headersEqual(
  a: readonly CngxAccordionHeaderHandle[],
  b: readonly CngxAccordionHeaderHandle[],
): boolean {
  if (a === b) {
    return true;
  }
  if (a.length !== b.length) {
    return false;
  }
  return a.every((handle) => b.includes(handle));
}
