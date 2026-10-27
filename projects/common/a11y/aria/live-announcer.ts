import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, Injectable, type OnDestroy, PLATFORM_ID } from '@angular/core';

import {
  createLiveRegionPair,
  type CngxLiveRegionPair,
  type CngxPendingAnnouncement,
} from './live-region-pair';

// A screen reader commonly misses a change to a live region that entered the
// DOM a frame earlier. A modal pair is created on the announcement that needs
// it, so its first write waits until the regions have settled.
const FIRST_MODAL_WRITE_DELAY_MS = 100;

const MODAL_SELECTOR = '[aria-modal="true"]';

/** A modal container a screen reader currently reads. */
function isOpenModal(el: HTMLElement): boolean {
  if (!el.isConnected || el.getAttribute('aria-modal') !== 'true') {
    return false;
  }
  return !(el instanceof HTMLDialogElement) || el.open;
}

// Overlays such as CngxDialog are appended to the body, and a nested modal
// follows its container, so document order is stacking order: the last open
// modal outside an inert subtree is the one a screen reader still reads.
function topmostOpenModal(doc: Document): HTMLElement | null {
  const open = Array.from(doc.querySelectorAll<HTMLElement>(MODAL_SELECTOR)).filter(
    (el) => isOpenModal(el) && !el.closest('[inert]'),
  );
  return open.at(-1) ?? null;
}

/**
 * Politeness channel for {@link CngxLiveAnnouncer.announce}: `'polite'` queues
 * after the current utterance, `'assertive'` interrupts it immediately.
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
 * third argument and the message goes to a region pair inside its enclosing
 * `[aria-modal="true"]` container instead; without a modal ancestor it goes to
 * the body regions as before. When another modal covers that one, the topmost
 * open modal receives it: the last `[aria-modal="true"]` element in document
 * order that is open and not inside an `[inert]` subtree. That covers a modal
 * nested inside the scope's own one as well as a sibling stacked on top of it,
 * which is how `CngxDialog` stacks dialogs (every host is appended to
 * `document.body`); a covered modal is hidden from assistive technology, so
 * its region would be silent. The pair is created with both regions on first
 * use and its first write waits until the regions have settled in the DOM. A
 * message still pending when its modal closes moves to the next enclosing open
 * modal, else to the topmost modal still open, else to the body regions, and
 * the pair is removed. The scope is opt-in per call - an unscoped announcement
 * never guesses a modal. {@link injectScopedLiveRegion} is the injection-time
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
   * One pair per open `aria-modal` container, released once it closes.
   * `outer` is the container's parent at creation, the route for its unwritten
   * messages when it is removed from the DOM.
   */
  private readonly modalRegions = new Map<
    HTMLElement,
    { readonly pair: CngxLiveRegionPair; readonly outer: Element | null }
  >();

  /**
   * Announces `message` through the fixed-politeness live region.
   *
   * @param message Text read by the screen reader.
   * @param politeness `'polite'` (default) queues after the current
   *   utterance; `'assertive'` interrupts immediately. Each politeness owns its
   *   own region, so the two never overwrite each other.
   * @param scope The announcing element. When it sits inside an
   *   `[aria-modal="true"]` container, the message is written into a region
   *   inside the topmost open modal (that container unless another modal
   *   covers it), which a screen reader still reads while the modal hides the
   *   rest of the page. `null` / omitted: the body regions.
   */
  announce(
    message: string,
    politeness: AriaLivePoliteness = 'polite',
    scope?: Element | null,
  ): void {
    if (!this.isBrowser) {
      return;
    }
    this.releaseClosedModals();
    this.route(scope, { message, politeness });
  }

  ngOnDestroy(): void {
    this.regions?.destroy();
    this.regions = null;
    for (const { pair } of this.modalRegions.values()) {
      pair.destroy();
    }
    this.modalRegions.clear();
  }

  /**
   * `fromModal` marks a message that was already scoped to a modal which has
   * since closed: with no open modal around its new scope it still goes to the
   * topmost open modal rather than to the silent body regions.
   */
  private route(
    scope: Element | null | undefined,
    announcement: CngxPendingAnnouncement,
    fromModal = false,
  ): void {
    const modal = this.targetModal(scope, fromModal);
    if (!modal) {
      this.regions ??= createLiveRegionPair(this.doc.body, this.doc);
      this.regions.announce(announcement.message, announcement.politeness);
      return;
    }
    const existing = this.modalRegions.get(modal);
    if (existing) {
      existing.pair.announce(announcement.message, announcement.politeness);
      return;
    }
    const pair = createLiveRegionPair(modal, this.doc, (due) => this.redirectIfClosed(modal, due));
    pair.ensure();
    this.modalRegions.set(modal, { pair, outer: modal.parentElement });
    pair.announce(announcement.message, announcement.politeness, FIRST_MODAL_WRITE_DELAY_MS);
  }

  /**
   * The topmost open modal when `scope` sits in an open modal (or the message
   * comes from a closed one), else `null` for the body regions. Falls back to
   * the scope's own modal when no candidate outside an inert subtree is open.
   */
  private targetModal(scope: Element | null | undefined, fromModal: boolean): HTMLElement | null {
    const own = this.enclosingOpenModal(scope);
    if (!own && !fromModal) {
      return null;
    }
    return topmostOpenModal(this.doc) ?? own;
  }

  private enclosingOpenModal(scope: Element | null | undefined): HTMLElement | null {
    let candidate = scope?.closest(MODAL_SELECTOR) ?? null;
    while (candidate) {
      if (candidate instanceof HTMLElement && isOpenModal(candidate)) {
        return candidate;
      }
      candidate = candidate.parentElement?.closest(MODAL_SELECTOR) ?? null;
    }
    return null;
  }

  private redirectIfClosed(modal: HTMLElement, due: CngxPendingAnnouncement): boolean {
    if (isOpenModal(modal)) {
      return false;
    }
    const outer = this.outerOf(modal);
    this.release(modal);
    this.route(outer, due, true);
    return true;
  }

  private releaseClosedModals(): void {
    for (const modal of Array.from(this.modalRegions.keys())) {
      if (!isOpenModal(modal)) {
        this.release(modal);
      }
    }
  }

  /** Drop the pair of a closed modal; its unwritten messages move outward. */
  private release(modal: HTMLElement): void {
    const entry = this.modalRegions.get(modal);
    if (!entry) {
      return;
    }
    const outer = this.outerOf(modal);
    this.modalRegions.delete(modal);
    const unwritten = entry.pair.takePending();
    entry.pair.destroy();
    for (const announcement of unwritten) {
      this.route(outer, announcement, true);
    }
  }

  private outerOf(modal: HTMLElement): Element | null {
    return modal.parentElement ?? this.modalRegions.get(modal)?.outer ?? null;
  }
}
