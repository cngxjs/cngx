import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

/**
 * Global live-region announcer for the Select family. Maintains exactly one
 * `aria-live` container per document and announces selection-change messages
 * with a configurable politeness.
 *
 * Scoped `providedIn: 'root'` so the same region is reused across every
 * select component in the app. Individual select instances decide (via config)
 * whether to push messages through it.
 *
 * @category interactive
 */
@Injectable({ providedIn: 'root' })
export class CngxSelectAnnouncer {
  private readonly doc = inject(DOCUMENT);
  private politeElement: HTMLElement | null = null;
  private assertiveElement: HTMLElement | null = null;
  private clearTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Announce `message` via the live region with the given politeness. The
   * region is emptied ~150ms before being updated so screen readers treat
   * each message as a fresh event even when content is identical.
   */
  announce(message: string, politeness: 'polite' | 'assertive' = 'polite'): void {
    const element = this.ensureRegion(politeness);
    if (!element) {
      return;
    }
    element.textContent = '';
    if (this.clearTimer) {
      clearTimeout(this.clearTimer);
    }
    this.clearTimer = setTimeout(() => {
      element.textContent = message;
      this.clearTimer = null;
    }, 16);
  }

  private ensureRegion(politeness: 'polite' | 'assertive'): HTMLElement | null {
    if (politeness === 'polite' && this.politeElement) {
      return this.politeElement;
    }
    if (politeness === 'assertive' && this.assertiveElement) {
      return this.assertiveElement;
    }
    const body = this.doc.body;
    if (!body) {
      return null;
    }
    const element = this.doc.createElement('div');
    element.setAttribute('aria-live', politeness);
    element.setAttribute('role', 'status');
    element.setAttribute('aria-atomic', 'true');
    element.className = `cngx-select-announcer cngx-select-announcer--${politeness}`;
    // Visually hidden — off-screen but still read by AT.
    element.style.cssText = [
      'position:absolute',
      'inline-size:1px',
      'block-size:1px',
      'margin:-1px',
      'padding:0',
      'overflow:hidden',
      'clip:rect(0 0 0 0)',
      'clip-path:inset(50%)',
      'white-space:nowrap',
      'border:0',
    ].join(';');
    body.appendChild(element);
    if (politeness === 'polite') {
      this.politeElement = element;
    } else {
      this.assertiveElement = element;
    }
    return element;
  }
}
