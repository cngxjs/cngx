import {
  computed,
  contentChildren,
  Directive,
  ElementRef,
  inject,
  input,
  output,
  signal,
  type Signal,
} from '@angular/core';
import { CngxLiveAnnouncer } from '@cngx/common/a11y';
import { CNGX_INPUT_CONFIG, DEFAULT_INPUT_ARIA_LABELS } from './input-config';

/**
 * Marks a single input slot within a `[cngxOtpInput]` container.
 *
 * ```html
 * @for (i of otp.indices(); track i) {
 *   <input [cngxOtpSlot]="i" />
 * }
 * ```
 *
 * @category forms/input
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/input/otp-input.directive.ts
 * @since 0.1.0
 * @relatedTo CngxOtpInput, CngxInput
 * <example-url>http://localhost:4200/#/forms/input/otp/4-digit-pin</example-url>
 * <example-url>http://localhost:4200/#/forms/input/otp/6-digit-otp</example-url>
 */
@Directive({
  selector: 'input[cngxOtpSlot]',
  standalone: true,
  exportAs: 'cngxOtpSlot',
  host: {
    '[attr.type]': 'inputAttrType()',
    '[attr.maxlength]': '1',
    '[attr.autocomplete]': 'index() === 0 ? "one-time-code" : "off"',
    '[attr.inputmode]': 'inputMode()',
    '[attr.aria-label]': 'slotLabel()',
    '(input)': 'handleInput($event)',
    '(keydown)': 'handleKeyDown($event)',
    '(paste)': 'handlePaste($event)',
    '(focus)': 'handleFocus()',
  },
})
export class CngxOtpSlot {
  /** The zero-based index of this slot. */
  readonly index = input.required<number>({ alias: 'cngxOtpSlot' });

  private readonly parent = inject(CngxOtpInput);
  private readonly config = inject(CNGX_INPUT_CONFIG);

  /** Per-slot accessible label, e.g. `'Digit 1 of 6'`. Config-driven, EN default. */
  protected readonly slotLabel = computed(() => {
    const factory = this.config.ariaLabels?.otpSlot ?? DEFAULT_INPUT_ARIA_LABELS.otpSlot;
    return factory(this.index(), this.parent.length());
  });

  /** @internal - exposed for parent `CngxOtpInput` to read/write slot values. */
  readonly el = inject<ElementRef<HTMLInputElement>>(ElementRef);

  /** @internal */
  protected readonly inputMode = computed(() =>
    this.parent.inputType() === 'number' ? 'numeric' : 'text',
  );

  /**
   * @internal - projected `<input type>` value.
   *
   * - `'password'` → `type="password"` so the browser native-masks the
   *   digit (• or ●) without us touching the value.
   * - `'number'`   → keep `type="text"` (we control numeric-only via
   *   `inputmode="numeric"`); `type="number"` enables spinners and
   *   breaks single-character paste semantics.
   * - `'text'`     → `type="text"`.
   */
  protected readonly inputAttrType = computed(() =>
    this.parent.inputType() === 'password' ? 'password' : 'text',
  );

  /** @internal */
  protected handleInput(_event: Event): void {
    const el = this.el.nativeElement;
    const value = el.value;

    if (value.length > 1) {
      el.value = value[0];
    }

    this.parent.handleSlotInput(this.index(), el.value);
  }

  /** @internal */
  protected handleKeyDown(event: KeyboardEvent): void {
    const idx = this.index();

    if (event.key === 'Backspace') {
      const el = this.el.nativeElement;
      if (!el.value) {
        event.preventDefault();
        this.parent.focusAt(idx - 1);
      } else {
        el.value = '';
        this.parent.handleSlotInput(idx, '');
      }
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.parent.focusAt(idx - 1);
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.parent.focusAt(idx + 1);
    }
  }

  /** @internal */
  protected handlePaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text') ?? '';
    if (pasted) {
      this.parent.pasteFrom(this.index(), pasted);
    }
  }

  /** @internal */
  protected handleFocus(): void {
    this.el.nativeElement.select();
  }
}

/**
 * Container directive for OTP/PIN input with auto-advance.
 *
 * Renders no inputs - the consumer provides `<input [cngxOtpSlot]="i" />` elements
 * inside the container.
 *
 * ```html
 * <div cngxOtpInput [length]="6" #otp="cngxOtpInput" (completed)="verify($event)">
 *   @for (i of otp.indices(); track i) {
 *     <input [cngxOtpSlot]="i" />
 *   }
 * </div>
 * ```
 *
 * @category forms/input
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/input/otp-input.directive.ts
 * @since 0.1.0
 * @relatedTo CngxOtpSlot, CngxInput
 * <example-url>http://localhost:4200/#/forms/input/otp/4-digit-pin</example-url>
 * <example-url>http://localhost:4200/#/forms/input/otp/6-digit-otp</example-url>
 */
@Directive({
  selector: '[cngxOtpInput]',
  standalone: true,
  exportAs: 'cngxOtpInput',
  host: {
    role: 'group',
    '[attr.aria-label]': 'groupLabel()',
  },
})
export class CngxOtpInput {
  /** Number of input fields. */
  readonly length = input<number>(6);

  /** Input type for each slot: `'text'` (default), `'number'` (numeric keyboard), or `'password'` (masked). */
  readonly inputType = input<'text' | 'number' | 'password'>('text');

  private readonly config = inject(CNGX_INPUT_CONFIG);
  private readonly announcer = inject(CngxLiveAnnouncer);

  private readonly slots = contentChildren(CngxOtpSlot);
  private readonly valuesState = signal<string[]>([]);

  /** Group label announcing the boxes as one control. Config-driven, EN default. */
  protected readonly groupLabel = computed(
    () => this.config.ariaLabels?.otpGroup ?? DEFAULT_INPUT_ARIA_LABELS.otpGroup,
  );

  /** Array of indices for `@for` rendering. */
  readonly indices = computed(() => Array.from({ length: this.length() }, (_, i) => i));

  /** The combined value of all inputs. */
  readonly value: Signal<string> = computed(() => this.valuesState().join(''));

  /** `true` when all positions are filled. */
  readonly isComplete = computed(() => {
    const vals = this.valuesState();
    return vals.length === this.length() && vals.every((v) => v.length > 0);
  });

  /** Emitted when value changes. */
  readonly valueChange = output<string>();

  /** Emitted when all positions are filled. */
  readonly completed = output<string>();

  /** @internal - called by CngxOtpSlot */
  handleSlotInput(index: number, char: string): void {
    const len = this.length();
    const prev = this.valuesState();
    const vals = Array.from({ length: Math.max(len, index + 1) }, (_, i) =>
      i === index ? char : (prev[i] ?? ''),
    );
    this.valuesState.set(vals);
    this.valueChange.emit(vals.join(''));

    if (char && index < len - 1) {
      this.focusAt(index + 1);
    }

    if (vals.length === len && vals.every((v) => v.length > 0)) {
      this.completed.emit(vals.join(''));
      this.announceComplete();
    }
  }

  /** @internal - called by CngxOtpSlot on paste */
  pasteFrom(startIndex: number, text: string): void {
    const len = this.length();
    const prev = this.valuesState();
    // Index map once - avoid O(n²) find inside the loop.
    const allSlots = this.slots();
    const slotByIndex = new Map(allSlots.map((s) => [s.index(), s]));

    const vals = Array.from({ length: len }, (_, i) => {
      const charOffset = i - startIndex;
      if (charOffset >= 0 && charOffset < text.length) {
        const ch = text[charOffset];
        const slot = slotByIndex.get(i);
        if (slot) {
          slot.el.nativeElement.value = ch;
        }
        return ch;
      }
      return prev[i] ?? '';
    });

    this.valuesState.set(vals);
    this.valueChange.emit(vals.join(''));

    // Focus the next empty slot, or the last filled one if none empty after startIndex.
    const nextEmpty = vals.findIndex((v, i) => i >= startIndex && !v);
    this.focusAt(nextEmpty >= 0 ? nextEmpty : Math.min(startIndex + text.length, len - 1));

    if (vals.every((v) => v.length > 0)) {
      this.completed.emit(vals.join(''));
      this.announceComplete();
    }
  }

  /** Announces OTP completion to assistive tech. Config-driven, EN default. */
  private announceComplete(): void {
    this.announcer.announce(
      this.config.ariaLabels?.otpComplete ?? DEFAULT_INPUT_ARIA_LABELS.otpComplete,
    );
  }

  /** Focuses the input at the given index. */
  focusAt(index: number): void {
    if (index < 0 || index >= this.length()) {
      return;
    }
    const slot = this.slots().find((s) => s.index() === index);
    slot?.el.nativeElement.focus();
  }

  /** Clears all inputs and focuses the first. */
  clear(): void {
    const vals = Array.from<string>({ length: this.length() }).fill('');
    this.valuesState.set(vals);
    this.valueChange.emit('');
    for (const slot of this.slots()) {
      slot.el.nativeElement.value = '';
    }
    this.focusAt(0);
  }
}
