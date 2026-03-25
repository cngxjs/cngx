import { DOCUMENT } from '@angular/common';
import { DestroyRef, Directive, inject, input, output, signal, type Signal } from '@angular/core';

/**
 * Clipboard copy behavior — forms-free version for `@cngx/common`.
 *
 * Place on a button or any clickable element. Copies the provided text to the
 * clipboard. Shows a `copied` signal for visual feedback (auto-resets after
 * `resetDelay`). Falls back to `execCommand('copy')` when Clipboard API is
 * unavailable.
 *
 * Unlike `CngxCopyValue` from `@cngx/forms/input`, this has no forms dependency
 * and lives at Level 2 (`@cngx/common`), making it available to any consumer.
 *
 * @usageNotes
 *
 * ### Copy a token
 * ```html
 * <code>{{ apiKey() }}</code>
 * <button [cngxCopyText]="apiKey()" #cp="cngxCopyText">
 *   {{ cp.copied() ? 'Copied!' : 'Copy' }}
 * </button>
 * ```
 *
 * ### Copy with SR announcement
 * ```html
 * <button [cngxCopyText]="shareUrl()">Copy Link</button>
 * <span aria-live="polite" class="sr-only">
 *   {{ cp.copied() ? 'Link copied to clipboard' : '' }}
 * </span>
 * ```
 *
 * @category interactive
 */
@Directive({
  selector: '[cngxCopyText]',
  standalone: true,
  exportAs: 'cngxCopyText',
  host: {
    '(click)': 'copy()',
  },
})
export class CngxCopyText {
  private readonly destroyRef = inject(DestroyRef);
  private readonly doc = inject(DOCUMENT);

  /** The text to copy to the clipboard. */
  readonly text = input.required<string>({ alias: 'cngxCopyText' });

  /** Duration in ms to keep `copied` true after a successful copy. */
  readonly resetDelay = input<number>(2000);

  private readonly copiedState = signal(false);
  private resetTimer: ReturnType<typeof setTimeout> | null = null;

  /** `true` for `resetDelay` ms after a successful copy. */
  readonly copied: Signal<boolean> = this.copiedState.asReadonly();

  /** Whether the Clipboard API is available in this environment. */
  readonly supported = typeof navigator !== 'undefined' && !!navigator.clipboard;

  /** Emitted after a successful copy with the copied text. */
  readonly didCopy = output<string>();

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.resetTimer != null) {
        clearTimeout(this.resetTimer);
      }
    });
  }

  /** Copies the text to the clipboard. */
  async copy(): Promise<void> {
    const value = this.text();
    if (!value) {
      return;
    }

    try {
      if (this.supported) {
        await navigator.clipboard.writeText(value);
      } else {
        this.fallbackCopy(value);
      }

      this.copiedState.set(true);
      this.didCopy.emit(value);

      if (this.resetTimer != null) {
        clearTimeout(this.resetTimer);
      }
      this.resetTimer = setTimeout(() => {
        this.copiedState.set(false);
        this.resetTimer = null;
      }, this.resetDelay());
    } catch {
      // Clipboard write failed (permission denied) — silently ignore
    }
  }

  /** execCommand fallback for environments without Clipboard API. */
  private fallbackCopy(text: string): void {
    const textarea = this.doc.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.opacity = '0';
    this.doc.body.appendChild(textarea);
    textarea.select();
    this.doc.execCommand('copy');
    this.doc.body.removeChild(textarea);
  }
}
