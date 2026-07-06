import type { Signal } from '@angular/core';

/**
 * Registration handle a {@link CngxAccordionPanel} header passes to its
 * coordinator so the keyboard-nav factory can rove between headers without
 * discovering them through `contentChildren`. `contentChildren` never crosses
 * a child component's view boundary, so an accordion skin that renders each
 * header inside its own item view would rove over zero items; a registered
 * handle carries the header's live `element` and `disabled` state by reference
 * and is immune to that boundary.
 *
 * @category common/interactive/accordion
 */
export interface CngxAccordionHeaderHandle {
  /** Stable id of the panel this header controls. */
  readonly id: string;
  /** The header button element, used for DOM-order sorting and focus movement. */
  readonly element: HTMLElement;
  /** Whether this header is disabled (skipped by roving, not a tab stop). */
  readonly disabled: Signal<boolean>;
}

/**
 * Resolved keyboard surface for an accordion's headers. The panel binds
 * `tabindex` from {@link headerTabindex} and routes its `(keydown)` through
 * {@link handleKeydown}; a single header - the coordinator's `rovingActiveId` -
 * is the group's lone tab stop, so `Tab` always lands on it.
 *
 * @category common/interactive/accordion
 */
export interface CngxAccordionKeyboardNav {
  /**
   * Roving `tabindex` for a header: `0` for the header whose id matches the
   * coordinator's `rovingActiveId`, `-1` for every other. Derived from a
   * single source (Pillar 1 - never a second index to keep in sync).
   */
  headerTabindex(handle: CngxAccordionHeaderHandle): 0 | -1;
  /**
   * WAI-ARIA accordion navigation: ArrowUp/ArrowDown move between headers in
   * DOM order (Home/End jump to the first/last), skipping disabled headers,
   * looping at the edges. Moves DOM focus to the target and records it via
   * `host.setRovingActive(id)`. Returns silently for any other key so the
   * caller can chain further handlers.
   */
  handleKeydown(event: KeyboardEvent): void;
}

/**
 * Coordinator surface {@link createAccordionKeyboardNav} reads. The
 * `CngxAccordion` directive implements it; the factory stays a pure
 * `create*` (no `inject()`) so it works in any injection context and is
 * trivially unit-testable.
 *
 * @category common/interactive/accordion
 */
export interface CngxAccordionKeyboardNavHost {
  /** Every registered header, in registration order (the factory re-sorts by DOM position). */
  readonly headers: Signal<readonly CngxAccordionHeaderHandle[]>;
  /** Id of the header that is currently the group's single tab stop, or `null`. */
  readonly rovingActiveId: Signal<string | null>;
  /** Record the header the roving stop should move to. */
  setRovingActive(id: string): void;
}

/**
 * Inputs to {@link createAccordionKeyboardNav}. The coordinator owns the
 * registry and the roving source; focus scoping needs no container reference
 * because each handle carries its own `element`.
 *
 * @category common/interactive/accordion
 */
export interface CngxAccordionKeyboardNavOptions {
  readonly host: CngxAccordionKeyboardNavHost;
}

/**
 * Level-2 factory implementing the WAI-ARIA APG accordion keyboard model over
 * a registration model rather than `contentChildren` roving. Registration is
 * immune to component-view boundaries, so any accordion skin - the
 * `@cngx/ui/accordion` organism, or a future one that renders each header in
 * its own view - gets working Arrow/Home/End nav.
 *
 * Pillar 1 (Ableitung statt Verwaltung): the tab stop is derived from the
 * coordinator's `rovingActiveId`, not managed as a second index. Focus
 * movement is a DOM concern the factory owns - the coordinator only records
 * which header should be the stop; it never touches the DOM.
 *
 * @category common/interactive/accordion
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/accordion/accordion-keyboard-nav.ts
 * @since 0.1.0
 * @relatedTo CngxAccordion, CngxAccordionPanel, createTabKeyboardNav
 */
export function createAccordionKeyboardNav(
  opts: CngxAccordionKeyboardNavOptions,
): CngxAccordionKeyboardNav {
  // Registered headers sorted by DOM position. `compareDocumentPosition`
  // orders elements as they appear in the composed document, so headers
  // rendered inside separate item views still rove in visual order - the
  // whole reason this replaces `contentChildren` roving.
  const orderedHeaders = (): readonly CngxAccordionHeaderHandle[] => {
    return opts.host.headers().slice().sort((a, b) => {
      const relation = a.element.compareDocumentPosition(b.element);
      if (relation & Node.DOCUMENT_POSITION_FOLLOWING) {
        return -1;
      }
      if (relation & Node.DOCUMENT_POSITION_PRECEDING) {
        return 1;
      }
      return 0;
    });
  };

  // Index of the header that currently owns the roving stop, clamped into the
  // sorted list. Navigation always originates from this header.
  const activeIndex = (headers: readonly CngxAccordionHeaderHandle[]): number => {
    const id = opts.host.rovingActiveId();
    const found = headers.findIndex((h) => h.id === id);
    return found >= 0 ? found : 0;
  };

  // Next enabled header index in `direction`, looping at the edges. Mirrors the
  // step geometry of `createTabKeyboardNav`; the two copies are tolerated until
  // a third roving-nav factory justifies a shared primitive (rule of three).
  const step = (
    headers: readonly CngxAccordionHeaderHandle[],
    from: number,
    direction: 1 | -1,
  ): number | null => {
    const len = headers.length;
    if (len === 0) {
      return null;
    }
    let idx = from + direction;
    for (let i = 0; i < len; i++) {
      idx = ((idx % len) + len) % len;
      if (!headers[idx].disabled()) {
        return idx;
      }
      idx += direction;
    }
    return null;
  };

  // First (direction 1) or last (direction -1) enabled header, for Home/End.
  const edge = (
    headers: readonly CngxAccordionHeaderHandle[],
    direction: 1 | -1,
  ): number | null => {
    const len = headers.length;
    if (direction === 1) {
      for (let i = 0; i < len; i++) {
        if (!headers[i].disabled()) {
          return i;
        }
      }
    } else {
      for (let i = len - 1; i >= 0; i--) {
        if (!headers[i].disabled()) {
          return i;
        }
      }
    }
    return null;
  };

  return {
    headerTabindex: (handle) => (handle.id === opts.host.rovingActiveId() ? 0 : -1),
    handleKeydown: (event) => {
      const headers = orderedHeaders();
      if (headers.length === 0) {
        return;
      }
      const from = activeIndex(headers);
      let target: number | null;
      switch (event.key) {
        case 'ArrowDown':
          target = step(headers, from, 1);
          break;
        case 'ArrowUp':
          target = step(headers, from, -1);
          break;
        case 'Home':
          target = edge(headers, 1);
          break;
        case 'End':
          target = edge(headers, -1);
          break;
        default:
          return;
      }
      if (target === null) {
        return;
      }
      event.preventDefault();
      const header = headers[target];
      opts.host.setRovingActive(header.id);
      header.element.focus();
    },
  };
}
