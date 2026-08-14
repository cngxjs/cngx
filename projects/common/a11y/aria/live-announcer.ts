import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, Injectable, type OnDestroy, PLATFORM_ID } from '@angular/core';

type Politeness = 'polite' | 'assertive';

// One frame. Clear the region this long before writing so an intentionally
// repeated identical string still registers as a content change for the SR.
const CLEAR_DELAY_MS = 16;

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
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/a11y/aria/live-announcer.ts
 * @since 0.1.0
 * @relatedTo CngxLiveRegion
 */
@Injectable({ providedIn: 'root' })
export class CngxLiveAnnouncer implements OnDestroy {
  private readonly doc = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private politeRegion: HTMLElement | null = null;
  private assertiveRegion: HTMLElement | null = null;
  private readonly pending: Record<Politeness, ReturnType<typeof setTimeout> | null> = {
    polite: null,
    assertive: null,
  };

  /**
   * Announces `message` through the fixed-politeness live region.
   *
   * @param message Text read by the screen reader.
   * @param politeness `'polite'` (default) queues after the current
   *   utterance; `'assertive'` interrupts immediately. Each politeness owns its
   *   own region, so the two never overwrite each other.
   */
  announce(message: string, politeness: Politeness = 'polite'): void {
    if (!this.isBrowser) {
      return;
    }
    const region = this.ensureRegion(politeness);
    // Clear first, then write one frame later so repeating the same string
    // still registers as a content change for the SR. Polite and assertive
    // keep independent timers so one politeness never cancels the other.
    region.textContent = '';
    const existing = this.pending[politeness];
    if (existing !== null) {
      clearTimeout(existing);
    }
    this.pending[politeness] = setTimeout(() => {
      region.textContent = message;
      this.pending[politeness] = null;
    }, CLEAR_DELAY_MS);
  }

  ngOnDestroy(): void {
    for (const politeness of ['polite', 'assertive'] as const) {
      const timer = this.pending[politeness];
      if (timer !== null) {
        clearTimeout(timer);
        this.pending[politeness] = null;
      }
    }
    this.politeRegion?.remove();
    this.assertiveRegion?.remove();
    this.politeRegion = null;
    this.assertiveRegion = null;
  }

  private ensureRegion(politeness: Politeness): HTMLElement {
    const existing = politeness === 'polite' ? this.politeRegion : this.assertiveRegion;
    if (existing) {
      return existing;
    }
    const span = this.doc.createElement('span');
    span.setAttribute('aria-live', politeness);
    span.setAttribute('aria-atomic', 'true');
    span.className = 'cngx-sr-only';
    span.style.position = 'absolute';
    span.style.width = '1px';
    span.style.height = '1px';
    span.style.padding = '0';
    span.style.margin = '-1px';
    span.style.overflow = 'hidden';
    span.style.clip = 'rect(0, 0, 0, 0)';
    span.style.whiteSpace = 'nowrap';
    span.style.border = '0';
    this.doc.body.appendChild(span);
    if (politeness === 'polite') {
      this.politeRegion = span;
    } else {
      this.assertiveRegion = span;
    }
    return span;
  }
}
