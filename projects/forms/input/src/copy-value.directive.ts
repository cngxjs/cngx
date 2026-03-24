import {
  DestroyRef,
  Directive,
  inject,
  input,
  output,
  signal,
  type Signal,
} from '@angular/core';

/**
 * Clipboard copy behavior for input fields, tokens, API keys.
 *
 * Place on a button or any clickable element. Copies `value` input or reads from
 * a `source` element. Shows a `copied` signal for feedback (auto-resets after `resetDelay`).
 *
 * @example
 * ```html
 * <input #tokenInput readonly [value]="token()" />
 * <button [cngxCopyValue] [source]="tokenInput" #cp="cngxCopyValue">
 *   {{ cp.copied() ? 'Copied!' : 'Copy' }}
 * </button>
 *
 * <!-- With explicit value -->
 * <button [cngxCopyValue]="apiKey()">Copy API Key</button>
 * ```
 *
 * @category directives
 */
@Directive({
  selector: '[cngxCopyValue]',
  standalone: true,
  exportAs: 'cngxCopyValue',
  host: {
    '(click)': 'copy()',
  },
})
export class CngxCopyValue {
  private readonly destroyRef = inject(DestroyRef);

  /** The value to copy. Falls back to `source` element's value if not provided. */
  readonly value = input<string | undefined>(undefined, { alias: 'cngxCopyValue' });

  /** Reference to the source element (fallback when `value` input not set). */
  readonly source = input<HTMLInputElement | HTMLTextAreaElement | undefined>(undefined);

  /** Duration in ms to keep `copied` true after a successful copy. */
  readonly resetDelay = input<number>(2000);

  private readonly copiedState = signal(false);
  private resetTimer: ReturnType<typeof setTimeout> | null = null;

  /** `true` for `resetDelay` ms after a successful copy. */
  readonly copied: Signal<boolean> = this.copiedState.asReadonly();

  /** Whether the Clipboard API is available. */
  readonly supported = typeof navigator !== 'undefined' && !!navigator.clipboard;

  /** Emitted after a successful copy. */
  readonly didCopy = output<string>();

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.resetTimer != null) {
        clearTimeout(this.resetTimer);
      }
    });
  }

  /** Copies value to clipboard. */
  async copy(): Promise<void> {
    const text = this.resolveValue();
    if (!text) {
      return;
    }

    try {
      if (this.supported) {
        await navigator.clipboard.writeText(text);
      } else {
        this.fallbackCopy(text);
      }

      this.copiedState.set(true);
      this.didCopy.emit(text);

      if (this.resetTimer != null) {
        clearTimeout(this.resetTimer);
      }
      this.resetTimer = setTimeout(() => {
        this.copiedState.set(false);
        this.resetTimer = null;
      }, this.resetDelay());
    } catch {
      // Clipboard write failed (e.g. permission denied) — silently ignore
    }
  }

  private resolveValue(): string {
    const explicit = this.value();
    if (explicit != null && explicit !== '') {
      return explicit;
    }
    return this.source()?.value ?? '';
  }

  private fallbackCopy(text: string): void {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}
