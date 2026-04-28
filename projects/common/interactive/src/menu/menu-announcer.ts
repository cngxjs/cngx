import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';

/**
 * Global polite live-region announcer for the menu family. Maintains a
 * single hidden `aria-live="polite"` element per document and announces
 * menu state transitions (submenu open/close, item activation).
 *
 * Scoped `providedIn: 'root'` so every menu in the app shares the same
 * region; messages are de-duped via a short clear-then-set cycle so
 * screen readers treat repeated identical messages as fresh events.
 *
 * @category interactive
 */
@Injectable({ providedIn: 'root' })
export class CngxMenuAnnouncer {
  private readonly doc = inject(DOCUMENT);
  private politeElement: HTMLElement | null = null;
  private clearTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Announce a message via the polite live region. Empty messages are
   * ignored. The region is cleared ~16ms before being repopulated so AT
   * picks up identical-text repeats as a new event.
   */
  announce(message: string): void {
    if (!message) {
      return;
    }
    const element = this.ensureRegion();
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

  private ensureRegion(): HTMLElement | null {
    if (this.politeElement) {
      return this.politeElement;
    }
    const body = this.doc.body;
    if (!body) {
      return null;
    }
    const el = this.doc.createElement('div');
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('role', 'status');
    el.setAttribute('aria-atomic', 'true');
    el.className = 'cngx-menu-announcer';
    el.style.cssText =
      'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0';
    body.appendChild(el);
    this.politeElement = el;
    return el;
  }
}

/**
 * Resolve the {@link CngxMenuAnnouncer} from the current injection scope.
 * Must run inside an injection context.
 *
 * @category interactive
 */
export function injectMenuAnnouncer(): CngxMenuAnnouncer {
  return inject(CngxMenuAnnouncer);
}
