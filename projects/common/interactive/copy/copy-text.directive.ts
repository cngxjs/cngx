import { DOCUMENT } from '@angular/common';
import {
  computed,
  DestroyRef,
  Directive,
  inject,
  input,
  output,
  signal,
  type Signal,
} from '@angular/core';

/**
 * Clipboard copy behavior - forms-free version for `@cngx/common`.
 *
 * Place on a button or any clickable element. Copies the provided text to the
 * clipboard. Shows a `copied` signal for visual feedback (auto-resets after
 * `resetDelay`). Falls back to `execCommand('copy')` when Clipboard API is
 * unavailable.
 *
 * Unlike `CngxCopyValue` from `@cngx/forms/input`, this has no forms dependency
 * and lives at Level 2 (`@cngx/common`), making it available to any consumer.
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
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/copy/copy-text.directive.ts
 * @since 0.1.0
 * @relatedTo CngxCopyBlock, CngxCopyValue
 * <example-url>/#/common/interactive/copy/text/copy-token</example-url>
 * <example-url>/#/common/interactive/copy/text/copy-url-with-sr-announcement</example-url>
 * @axis level atom
 */
@Directive({
  selector: '[cngxCopyText]',
  standalone: true,
  exportAs: 'cngxCopyText',
  host: {
    '(click)': 'handleClick()',
  },
})
export class CngxCopyText {
  private readonly destroyRef = inject(DestroyRef);
  private readonly doc = inject(DOCUMENT);

  /** The text to copy to the clipboard. */
  readonly text = input.required<string>({ alias: 'cngxCopyText' });

  /**
   * Duration in ms to keep `copied` or `failed` true after an attempt; the
   * state then returns to idle.
   */
  readonly resetDelay = input<number>(2000);

  private readonly state = signal<'idle' | 'copied' | 'failed'>('idle');
  private resetTimer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;

  /** `true` for `resetDelay` ms after a successful copy. Never true together with `failed`. */
  readonly copied: Signal<boolean> = computed(() => this.state() === 'copied');

  /**
   * `true` for `resetDelay` ms after a failed copy attempt (permission
   * denied, refused fallback). Never true together with `copied`.
   */
  readonly failed: Signal<boolean> = computed(() => this.state() === 'failed');

  /** Whether the Clipboard API is available in this environment. */
  readonly supported = typeof navigator !== 'undefined' && !!navigator.clipboard;

  /** Emitted after a successful copy with the copied text. */
  readonly didCopy = output<string>();

  /**
   * Emitted when a copy attempt fails: with the rejection reason when the
   * Clipboard API rejects the write, with `undefined` when the
   * `execCommand('copy')` fallback reports `false`.
   */
  readonly copyFailed = output<unknown>();

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
      if (this.resetTimer != null) {
        clearTimeout(this.resetTimer);
      }
    });
  }

  /**
   * Host click handler - fire-and-forget wrapper so the event binding
   * does not leak the promise the public {@link copy} API returns.
   */
  protected handleClick(): void {
    void this.copy();
  }

  /** Copies the text to the clipboard. */
  async copy(): Promise<void> {
    const value = this.text();
    if (!value) {
      return;
    }

    if (this.state() === 'failed') {
      this.state.set('idle');
    }

    let done: boolean;
    try {
      if (this.supported) {
        await navigator.clipboard.writeText(value);
        done = true;
      } else {
        done = this.fallbackCopy(value);
      }
    } catch (err: unknown) {
      this.handleFailed(err);
      return;
    }

    if (done) {
      this.handleCopied(value);
    } else {
      this.handleFailed(undefined);
    }
  }

  private handleCopied(value: string): void {
    if (this.destroyed) {
      return;
    }
    this.settle('copied');
    this.didCopy.emit(value);
  }

  private handleFailed(reason: unknown): void {
    if (this.destroyed) {
      return;
    }
    this.settle('failed');
    this.copyFailed.emit(reason);
  }

  private settle(outcome: 'copied' | 'failed'): void {
    this.state.set(outcome);
    if (this.resetTimer != null) {
      clearTimeout(this.resetTimer);
    }
    this.resetTimer = setTimeout(() => {
      this.state.set('idle');
      this.resetTimer = null;
    }, this.resetDelay());
  }

  /**
   * execCommand fallback for environments without Clipboard API. Returns
   * whether the browser reported the copy as done.
   */
  private fallbackCopy(text: string): boolean {
    const textarea = this.doc.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.opacity = '0';
    this.doc.body.appendChild(textarea);
    try {
      textarea.select();
      return this.doc.execCommand('copy');
    } finally {
      textarea.remove();
    }
  }
}
