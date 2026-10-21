import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, Injectable, type OnDestroy, PLATFORM_ID } from '@angular/core';

import {
  CLEAR_DELAY_MS,
  createLiveRegionPair,
  type CngxLiveRegionPair,
  type CngxPendingAnnouncement,
} from './live-region-pair';

// A modal region is inserted by the announce that needs it. Two clear frames
// keep it empty for at least one full rendered frame, so the screen reader has
// registered the live region before its first content change arrives.
const MODAL_SETTLE_MS = 2 * CLEAR_DELAY_MS;

const MODAL_SELECTOR = '[aria-modal="true"]';

function isOpenModal(el: Element): el is HTMLElement {
  if (!(el instanceof HTMLElement) || el.closest('[inert]')) {
    return false;
  }
  return !(el instanceof HTMLDialogElement) || el.open;
}

// Document order is stacking order for overlays appended to the body and for
// a modal nested inside another, so the last open modal is the topmost one.
function topmostOpenModal(doc: Document): HTMLElement | null {
  const open = Array.from(doc.querySelectorAll(MODAL_SELECTOR)).filter(isOpenModal);
  return open.at(-1) ?? null;
}

/**
 * Politeness channel for {@link CngxLiveAnnouncer.announce}: `'polite'` queues
 * after the current utterance, `'assertive'` interrupts it immediately.
 *
 * @category common/a11y
 */
export type AriaLivePoliteness = 'polite' | 'assertive';

/**
 * Imperative, reusable polite/assertive live-region announcer.
 *
 * The imperative counterpart to {@link CngxLiveRegion}: where the directive
 * decorates an element you render (the content IS the announcement), this
 * service owns two visually-hidden `aria-live` regions appended to
 * `document.body` - one persistent polite node and one persistent assertive
 * node - and exposes an `announce(message, politeness)` call for template-less
 * directives and event handlers (e.g. `CngxCopyValue` copy success,
 * `CngxOtpInput` completion).
 *
 * Each region is created lazily on the first announcement of its politeness and
 * reused thereafter. Because polite and assertive live in separate fixed-
 * politeness nodes, an assertive announcement never clobbers a concurrent
 * polite one. Per region, the text is cleared and re-set one frame later so an
 * identical consecutive message is still re-read by the screen reader.
 *
 * A modal dialog hides everything outside it from assistive technology, so a
 * body region is silent while one is open. Pass the announcing element as the
 * third argument and, when it sits inside an `[aria-modal="true"]` container,
 * the message goes to a region pair inside the topmost open modal instead;
 * without a modal ancestor it goes to the body regions as before. The scope is
 * opt-in per call - an unscoped announcement never guesses a modal.
 *
 * Modal routing details:
 * - The topmost open modal is the last `[aria-modal="true"]` element in
 *   document order that is not inside an `[inert]` subtree and, for a
 *   `<dialog>`, is open. That is the scope's own modal unless a nested or
 *   later modal covers it (or the scope's modal is inert); the covered one is
 *   hidden from assistive technology, so its region would be silent.
 * - A modal pair is created by the first scoped announce and its regions stay
 *   empty for two clear frames (instead of one), so the region has been in the
 *   accessibility tree for a full frame before the first message lands. Later
 *   messages use the usual one-frame clear-then-write.
 * - When the modal container leaves the document while a write is pending,
 *   that write and every other pending one of the pair are re-routed to the
 *   body regions and the pair is dropped; a container attached again gets a
 *   fresh pair. {@link injectScopedLiveRegion} is the injection-time
 * alternative when the caller knows its overlay host up front.
 *
 * SSR-safe: all DOM access is guarded by `isPlatformBrowser`; on the server
 * `announce()` is a no-op and no region is created.
 *
 * ```typescript
 * const announcer = inject(CngxLiveAnnouncer);
 * announcer.announce('Copied');
 * announcer.announce('Save failed', 'assertive');
 * announcer.announce('Alert dismissed', 'polite', hostElement); // inside a modal
 * ```
 *
 * @category common/a11y
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/a11y/aria/live-announcer.ts
 * @since 0.1.0
 * @relatedTo CngxLiveRegion
 */
@Injectable({ providedIn: 'root' })
export class CngxLiveAnnouncer implements OnDestroy {
  private readonly doc = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private regions: CngxLiveRegionPair | null = null;
  /**
   * One pair per `aria-modal` container. A strong map so destroy can cancel
   * every pending modal write; entries of containers that left the document
   * are swept whenever a new modal pair is created.
   */
  private readonly modalRegions = new Map<HTMLElement, CngxLiveRegionPair>();

  /**
   * Announces `message` through the fixed-politeness live region.
   *
   * @param message Text read by the screen reader.
   * @param politeness `'polite'` (default) queues after the current
   *   utterance; `'assertive'` interrupts immediately. Each politeness owns its
   *   own region, so the two never overwrite each other.
   * @param scope The announcing element. When it sits inside an
   *   `[aria-modal="true"]` container, the message is written into a region
   *   inside the topmost open modal, which a screen reader still reads while
   *   the modal hides the rest of the page. `null` / omitted: the body regions.
   */
  announce(
    message: string,
    politeness: AriaLivePoliteness = 'polite',
    scope?: Element | null,
  ): void {
    if (!this.isBrowser) {
      return;
    }
    this.pairFor(scope).announce(message, politeness);
  }

  private pairFor(scope: Element | null | undefined): CngxLiveRegionPair {
    const modal = scope?.closest(MODAL_SELECTOR) ? topmostOpenModal(this.doc) : null;
    if (!modal) {
      return this.bodyPair();
    }
    return this.modalRegions.get(modal) ?? this.createModalPair(modal);
  }

  private bodyPair(): CngxLiveRegionPair {
    this.regions ??= createLiveRegionPair(this.doc.body, this.doc);
    return this.regions;
  }

  private createModalPair(modal: HTMLElement): CngxLiveRegionPair {
    for (const [container, stale] of this.modalRegions) {
      if (!container.isConnected) {
        this.rerouteToBody(container, stale.takePending());
      }
    }
    const pair = createLiveRegionPair(modal, this.doc, {
      settleMs: MODAL_SETTLE_MS,
      onDetached: (announcement) =>
        this.rerouteToBody(modal, [announcement, ...pair.takePending()]),
    });
    this.modalRegions.set(modal, pair);
    return pair;
  }

  /** Drop the pair of a container that left the document; speak its leftovers from the body. */
  private rerouteToBody(modal: HTMLElement, leftovers: readonly CngxPendingAnnouncement[]): void {
    this.modalRegions.get(modal)?.destroy();
    this.modalRegions.delete(modal);
    for (const { message, politeness } of leftovers) {
      this.bodyPair().announce(message, politeness);
    }
  }

  ngOnDestroy(): void {
    this.regions?.destroy();
    this.regions = null;
    for (const pair of this.modalRegions.values()) {
      pair.destroy();
    }
    this.modalRegions.clear();
  }
}
