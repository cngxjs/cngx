import { DOCUMENT } from '@angular/common';
import { DestroyRef, Directive, ElementRef, inject, input, signal } from '@angular/core';

/**
 * Stores the previously focused element and restores focus on destroy.
 *
 * Prevents focus from falling to `<body>` when dynamic content is removed
 * (dialogs closing, panels collapsing, tabs switching). The directive captures
 * `document.activeElement` at initialization time and restores it when the
 * host element is destroyed.
 *
 * Fallback chain: stored element → provided fallback → nearest focusable ancestor → body.
 *
 * @usageNotes
 *
 * ### Panel that restores focus on close
 * ```html
 * @if (panelOpen()) {
 *   <div cngxFocusRestore>
 *     Panel content…
 *     <button (click)="panelOpen.set(false)">Close</button>
 *   </div>
 * }
 * ```
 *
 * ### With explicit fallback
 * ```html
 * <div cngxFocusRestore [focusRestoreFallback]="fallbackBtn">
 *   Dynamic content…
 * </div>
 * <button #fallbackBtn>Fallback target</button>
 * ```
 *
 * @category a11y
 */
@Directive({
  selector: '[cngxFocusRestore]',
  exportAs: 'cngxFocusRestore',
  standalone: true,
})
export class CngxFocusRestore {
  /** Whether to restore focus when the host element is destroyed. */
  readonly restoreOnDestroy = input<boolean>(true);
  /** Explicit fallback element if the stored element is no longer in the DOM. */
  readonly fallback = input<HTMLElement | null>(null);

  private readonly doc = inject(DOCUMENT);
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly storedElement = signal<HTMLElement | null>(null);

  constructor() {
    // Capture whatever has focus right now — this is the element we'll
    // return to when the host is removed from the DOM.
    const activeEl = this.doc.activeElement;
    if (activeEl instanceof HTMLElement) {
      this.storedElement.set(activeEl);
    }

    // On destroy, walk the fallback chain and restore focus.
    // Without this, focus falls to <body> and SR users lose their place.
    inject(DestroyRef).onDestroy(() => {
      if (!this.restoreOnDestroy()) {
        return;
      }

      const target = this.resolveTarget();
      if (target) {
        target.focus();
      }
    });
  }

  /** Manually store the current focus target for later restoration. */
  capture(): void {
    const activeEl = this.doc.activeElement;
    if (activeEl instanceof HTMLElement) {
      this.storedElement.set(activeEl);
    }
  }

  /** Manually restore focus to the stored element. */
  restore(): void {
    const target = this.resolveTarget();
    if (target) {
      target.focus();
    }
  }

  /**
   * Walks the fallback chain:
   * 1. Stored element (if still in DOM and not body/self)
   * 2. Explicit fallback input
   * 3. Nearest focusable ancestor
   */
  private resolveTarget(): HTMLElement | null {
    const stored = this.storedElement();
    // Skip body — it means "nothing was focused", not "focus body"
    if (
      stored &&
      stored !== this.doc.body &&
      this.doc.contains(stored) &&
      stored !== (this.el.nativeElement as HTMLElement)
    ) {
      return stored;
    }

    const fallback = this.fallback();
    if (fallback && this.doc.contains(fallback)) {
      return fallback;
    }

    return this.findFocusableAncestor();
  }

  /** Traverses up the DOM tree looking for the first natively focusable element. */
  private findFocusableAncestor(): HTMLElement | null {
    let current = (this.el.nativeElement as HTMLElement).parentElement;
    while (current) {
      if (this.isFocusable(current)) {
        return current;
      }
      current = current.parentElement;
    }
    return null;
  }

  /** Checks if an element is natively focusable (tabindex, links, form controls). */
  private isFocusable(el: HTMLElement): boolean {
    if (el.tabIndex >= 0) {
      return true;
    }
    const tag = el.tagName.toLowerCase();
    return (
      (tag === 'a' && el.hasAttribute('href')) ||
      tag === 'button' ||
      tag === 'input' ||
      tag === 'select' ||
      tag === 'textarea'
    );
  }
}
