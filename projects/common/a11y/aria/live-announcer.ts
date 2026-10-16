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
 * SSR-safe: all DOM access is guarded by `isPlatformBrowser`; on the server
 * `announce()` is a no-op and no region is created.
 *
 * ```typescript
 * const announcer = inject(CngxLiveAnnouncer);
 * announcer.announce('Copied');
 * announcer.announce('Save failed', 'assertive');
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
   * Announces `message` through the fixed-politeness live region.
   *
   * @param message Text read by the screen reader.
   * @param politeness `'polite'` (default) queues after the current
   *   utterance; `'assertive'` interrupts immediately. Each politeness owns its
   *   own region, so the two never overwrite each other.
   */
  announce(message: string, politeness: AriaLivePoliteness = 'polite'): void {
    if (!this.isBrowser) {
      return;
    }
    this.regions ??= createLiveRegionPair(this.doc.body, this.doc);
    this.regions.announce(message, politeness);
  }

  ngOnDestroy(): void {
    this.regions?.destroy();
    this.regions = null;
  }
}
