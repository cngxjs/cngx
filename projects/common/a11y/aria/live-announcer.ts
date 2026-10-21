import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, Injectable, type OnDestroy, PLATFORM_ID } from '@angular/core';

import { createLiveRegionPair, type CngxLiveRegionPair } from './live-region-pair';

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
 * `[aria-modal="true"]` container instead (created on first use, removed with
 * the container); without a modal ancestor it goes to the body regions as
 * before. The scope is opt-in per call - an unscoped announcement never
 * guesses a modal. {@link injectScopedLiveRegion} is the injection-time
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
  /** One pair per `aria-modal` container; dies with the container. */
  private readonly modalRegions = new WeakMap<Element, CngxLiveRegionPair>();

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
    this.pairFor(scope).announce(message, politeness);
  }

  private pairFor(scope: Element | null | undefined): CngxLiveRegionPair {
    const modal = scope?.closest('[aria-modal="true"]');
    if (!(modal instanceof HTMLElement)) {
      this.regions ??= createLiveRegionPair(this.doc.body, this.doc);
      return this.regions;
    }
    let pair = this.modalRegions.get(modal);
    if (!pair) {
      pair = createLiveRegionPair(modal, this.doc);
      this.modalRegions.set(modal, pair);
    }
    return pair;
  }

  ngOnDestroy(): void {
    this.regions?.destroy();
    this.regions = null;
  }
}
