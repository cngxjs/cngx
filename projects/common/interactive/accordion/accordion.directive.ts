import { computed, Directive, input, linkedSignal, model, signal } from '@angular/core';
import { setEqual } from '@cngx/utils';

import {
  createAccordionKeyboardNav,
  type CngxAccordionHeaderHandle,
  type CngxAccordionKeyboardNav,
} from './accordion-keyboard-nav';
import { CNGX_ACCORDION, type CngxAccordionHost } from './accordion.token';

/**
 * Coordinating directive for an accordion. Put `cngxAccordion` on the
 * container; each header carries {@link CngxAccordionPanel}. The container owns
 * two single sources of truth - one `openIds` set signal (expansion) and one
 * header registry (`rovingActiveId`) - and arbitrates single- vs multi-open. No
 * panel owns mutable expansion state and no effect syncs siblings: every
 * panel's `aria-expanded` derives from the open-set signal (Pillar 1).
 *
 * Header arrow-key navigation runs through {@link createAccordionKeyboardNav}
 * over a header registry rather than `contentChildren` roving. Panels register
 * their header handle on init, so navigation survives a skin that renders each
 * header inside its own component view - the reason {@link CngxAccordionPanel}
 * self-wires `tabindex`/`keydown` instead of relying on a container-level
 * roving directive.
 *
 * ```html
 * <div cngxAccordion #acc="cngxAccordion" [multi]="false">
 *   <button cngxAccordionPanel id="head-a" panelId="a" controls="region-a">Section A</button>
 *   <div role="region" id="region-a" aria-labelledby="head-a" [hidden]="!acc.isOpen('a')">…</div>
 *   <button cngxAccordionPanel id="head-b" panelId="b" controls="region-b">Section B</button>
 *   <div role="region" id="region-b" aria-labelledby="head-b" [hidden]="!acc.isOpen('b')">…</div>
 * </div>
 * ```
 *
 * @category common/interactive/accordion
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/accordion/accordion.directive.ts
 * @since 0.1.0
 * @relatedTo CngxAccordionPanel, createAccordionKeyboardNav
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

  /**
   * Controlled set of open panel ids - the accordion's primary value, exposed
   * as a `model` so a consumer can seed initially-open panels or drive
   * expansion declaratively (router / SSR). `model()` takes no `equal`, so the
   * equality discipline lives on {@link effectiveOpenIds} below - the derived
   * set every panel reads. `toggle()` is the only writer on interaction; the
   * consumer may also write it. No effect syncs it (Pillar 1).
   */
  readonly openIds = model<ReadonlySet<string>>(new Set());

  // Single-open arbitration is a derivation, never an effect: a consumer-seeded
  // multi-id set is clamped to the last id when `!multi()`, projecting an
  // invalid single-mode seed valid without writing it back (controlled-wins).
  // `setEqual` guards the collection so an identical open-set never re-fires the
  // panels' `aria-expanded` computeds (Pillar 1 equality discipline).
  private readonly effectiveOpenIds = computed<ReadonlySet<string>>(
    () => {
      const ids = this.openIds();
      return this.multi() || ids.size <= 1 ? ids : new Set([...ids].slice(-1));
    },
    { equal: setEqual },
  );

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

  readonly nav: CngxAccordionKeyboardNav = createAccordionKeyboardNav({ host: this });

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
    return this.effectiveOpenIds().has(panelId);
  }

  toggle(panelId: string): void {
    // Read the clamped set, not the raw model, so the mutate base matches what
    // isOpen() reports: clicking a panel the clamp has hidden opens it rather
    // than acting on a stale raw-set membership. Identical to the raw model in
    // every valid case (clamp == model when multi, or the set holds <= 1 id).
    const open = this.effectiveOpenIds();
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
 * signal reference), so this comparator only suppresses re-fires from a
 * re-register of the same set; it does not gate the roving derivation on
 * disabled state - `rovingActiveId` reads each handle's `disabled()` directly,
 * so a disabled flip still re-runs it (which is what keeps the tab stop off a
 * newly-disabled header).
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
