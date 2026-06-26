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
import { CngxLiveAnnouncer } from '@cngx/common/a11y';
import { CNGX_INPUT_CONFIG, DEFAULT_INPUT_ARIA_LABELS } from './input-config';

/**
 * Clipboard copy behavior for input fields, tokens, API keys.
 *
 * Place on a button or any clickable element. Copies `value` input or reads from
 * a `source` element. Shows a `copied` signal for feedback (auto-resets after `resetDelay`).
 *
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
 * @category forms/input
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/input/copy-value.directive.ts
 * @since 0.1.0
 * @relatedTo CngxInput, CngxInputClear, CngxPasswordToggle
 * <example-url>http://localhost:4200/#/forms/input/utilities/copy-to-clipboard</example-url>
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
  private readonly config = inject(CNGX_INPUT_CONFIG);
  private readonly announcer = inject(CngxLiveAnnouncer);

  /** The value to copy. Falls back to `source` element's value if not provided. */
  readonly value = input<string | undefined>(undefined, { alias: 'cngxCopyValue' });

  /** Reference to the source element (fallback when `value` input not set). */
  readonly source = input<HTMLInputElement | HTMLTextAreaElement | undefined>(undefined);

  /** Duration in ms to keep `copied` true after a successful copy. Falls back to global config. */
  readonly resetDelay = input<number | undefined>(undefined);

  private readonly resolvedResetDelay = computed(
    () => this.resetDelay() ?? this.config.copyResetDelay ?? 2000,
  );

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
      this.announcer.announce(
        this.config.ariaLabels?.copySuccess ?? DEFAULT_INPUT_ARIA_LABELS.copySuccess,
      );
      this.didCopy.emit(text);

      if (this.resetTimer != null) {
        clearTimeout(this.resetTimer);
      }
      const handle: ReturnType<typeof setTimeout> = setTimeout(() => {
        // Race-guard: only flip back if this callback still owns the current handle.
        // A newer copy() between schedule and fire reassigns resetTimer to a different
        // handle, and we must not stomp on it.
        if (this.resetTimer === handle) {
          this.copiedState.set(false);
          this.resetTimer = null;
        }
      }, this.resolvedResetDelay());
      this.resetTimer = handle;
    } catch {
      // Clipboard write failed (permission denied, etc.). Announce assertively
      // so the failure is not a silent state change (Pillar 2).
      this.announcer.announce(
        this.config.ariaLabels?.copyError ?? DEFAULT_INPUT_ARIA_LABELS.copyError,
        'assertive',
      );
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
    if (typeof document === 'undefined' || typeof document.execCommand !== 'function') {
      return;
    }
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
