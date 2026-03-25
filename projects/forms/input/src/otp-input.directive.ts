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

/**
 * Marks a single input slot within a `[cngxOtpInput]` container.
 *
 * @example
 * ```html
 * @for (i of otp.indices(); track i) {
 *   <input [cngxOtpSlot]="i" />
 * }
 * ```
 *
 * @category directives
 */
@Directive({
  selector: 'input[cngxOtpSlot]',
  standalone: true,
  exportAs: 'cngxOtpSlot',
  host: {
    '[attr.maxlength]': '1',
    '[attr.autocomplete]': 'index() === 0 ? "one-time-code" : "off"',
    '[attr.inputmode]': 'inputMode()',
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

  /** @internal — exposed for parent `CngxOtpInput` to read/write slot values. */
  readonly el = inject<ElementRef<HTMLInputElement>>(ElementRef);

  /** @internal */
  protected readonly inputMode = computed(() =>
    this.parent.inputType() === 'number' ? 'numeric' : 'text',
  );

  /** @internal */
  protected handleInput(_event: Event): void {
    const el = this.el.nativeElement;
    const value = el.value;

    // Only keep one char
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
 * Renders no inputs — the consumer provides `<input [cngxOtpSlot]="i" />` elements
 * inside the container.
 *
 * @example
 * ```html
 * <div cngxOtpInput [length]="6" #otp="cngxOtpInput" (completed)="verify($event)">
 *   @for (i of otp.indices(); track i) {
 *     <input [cngxOtpSlot]="i" />
 *   }
 * </div>
 * ```
 *
 * @category directives
 */
@Directive({
  selector: '[cngxOtpInput]',
  standalone: true,
  exportAs: 'cngxOtpInput',
})
export class CngxOtpInput {
  /** Number of input fields. */
  readonly length = input<number>(6);

  /** Input type for each slot: `'text'` (default), `'number'` (numeric keyboard), or `'password'` (masked). */
  readonly inputType = input<'text' | 'number' | 'password'>('text');

  private readonly slots = contentChildren(CngxOtpSlot);
  private readonly valuesState = signal<string[]>([]);

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

  /** @internal — called by CngxOtpSlot */
  handleSlotInput(index: number, char: string): void {
    const vals = [...this.valuesState()];
    // Ensure array is long enough
    while (vals.length <= index) {
      vals.push('');
    }
    vals[index] = char;
    this.valuesState.set(vals);
    this.valueChange.emit(vals.join(''));

    // Auto-advance
    if (char && index < this.length() - 1) {
      this.focusAt(index + 1);
    }

    // Check completion
    if (vals.length === this.length() && vals.every((v) => v.length > 0)) {
      this.completed.emit(vals.join(''));
    }
  }

  /** @internal — called by CngxOtpSlot on paste */
  pasteFrom(startIndex: number, text: string): void {
    const vals = [...this.valuesState()];
    while (vals.length < this.length()) {
      vals.push('');
    }

    const allSlots = this.slots();
    let charIdx = 0;
    for (let i = startIndex; i < this.length() && charIdx < text.length; i++) {
      const ch = text[charIdx++];
      vals[i] = ch;
      const slot = allSlots.find((s) => s.index() === i);
      if (slot) {
        slot.el.nativeElement.value = ch;
      }
    }

    this.valuesState.set(vals);
    this.valueChange.emit(vals.join(''));

    // Focus the next empty slot or the last filled one
    const nextEmpty = vals.findIndex((v, i) => i >= startIndex && !v);
    this.focusAt(
      nextEmpty >= 0 ? nextEmpty : Math.min(startIndex + text.length, this.length() - 1),
    );

    if (vals.length === this.length() && vals.every((v) => v.length > 0)) {
      this.completed.emit(vals.join(''));
    }
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
