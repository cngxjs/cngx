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
 * third argument and the message goes to a region pair inside its enclosing
 * `[aria-modal="true"]` container instead; without a modal ancestor it goes to
 * the body regions as before. When a second modal is open inside that one,
 * the innermost open modal receives it, since everything else in the outer
 * modal is inert. The pair is created with both regions on first use and its
 * first write waits until the regions have settled in the DOM. A message still
 * pending when its modal closes moves to the next enclosing open modal or to
 * the body regions, and the pair is removed. The scope is opt-in per call - an
 * unscoped announcement never guesses a modal. {@link injectScopedLiveRegion} is the injection-time
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
   *   inside that container, which a screen reader still reads while the
   *   modal hides the rest of the page. `null` / omitted: the body regions.
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

  private route(scope: Element | null | undefined, announcement: CngxPendingAnnouncement): void {
    const modal = this.targetModal(scope);
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
   * The open modal that encloses `scope`, or the innermost open modal nested
   * inside it: while that one is open the rest of the enclosing modal is inert.
   */
  private targetModal(scope: Element | null | undefined): HTMLElement | null {
    const own = this.enclosingOpenModal(scope);
    if (!own) {
      return null;
    }
    let target = own;
    for (const nested of Array.from(own.querySelectorAll<HTMLElement>(MODAL_SELECTOR))) {
      if (isOpenModal(nested)) {
        target = nested;
      }
    }
    return target;
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
    this.route(outer, due);
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
      this.route(outer, announcement);
    }
  }

  private outerOf(modal: HTMLElement): Element | null {
    return modal.parentElement ?? this.modalRegions.get(modal)?.outer ?? null;
  }
}
