import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, Injectable, type OnDestroy, PLATFORM_ID } from '@angular/core';

/**
 * Imperative, reusable polite/assertive live-region announcer.
 *
 * The imperative counterpart to {@link CngxLiveRegion}: where the directive
 * decorates an element you render (the content IS the announcement), this
 * service owns a single visually-hidden `aria-live` element appended to
 * `document.body` and exposes an `announce(message)` call for template-less
 * directives and event handlers (e.g. `CngxCopyValue` copy success,
 * `CngxOtpInput` completion).
 *
 * One root element is created lazily on the first announcement and reused for
 * every subsequent call. The text is cleared and re-set on the next macrotask
 * so an identical consecutive message is still re-read by the screen reader.
 *
 * SSR-safe: all DOM access is guarded by `isPlatformBrowser`; on the server
 * `announce()` is a no-op and no element is created.
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

  private region: HTMLElement | null = null;
  private pending: ReturnType<typeof setTimeout> | null = null;

  /**
   * Announces `message` through the shared live region.
   *
   * @param message Text read by the screen reader.
   * @param politeness `'polite'` (default) queues after the current
   *   utterance; `'assertive'` interrupts immediately.
   */
  announce(message: string, politeness: 'polite' | 'assertive' = 'polite'): void {
    if (!this.isBrowser) {
      return;
    }
    const region = this.ensureRegion();
    region.setAttribute('aria-live', politeness);
    // Clear first, then write on the next macrotask so repeating the same
    // string still registers as a content change for the SR.
    region.textContent = '';
    if (this.pending !== null) {
      clearTimeout(this.pending);
    }
    this.pending = setTimeout(() => {
      region.textContent = message;
      this.pending = null;
    });
  }

  ngOnDestroy(): void {
    if (this.pending !== null) {
      clearTimeout(this.pending);
      this.pending = null;
    }
    this.region?.remove();
    this.region = null;
  }

  private ensureRegion(): HTMLElement {
    if (this.region) {
      return this.region;
    }
    const span = this.doc.createElement('span');
    span.setAttribute('aria-live', 'polite');
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
    this.region = span;
    return span;
  }
}
