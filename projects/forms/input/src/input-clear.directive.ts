import { DestroyRef, Directive, inject, input, output, signal, type Signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';

/**
 * Headless clear behavior for an input or textarea.
 *
 * Place on a button or any element. Pass a reference to the target input.
 * The consumer renders the UI — this directive only provides the behavior.
 *
 * @example
 * ```html
 * <input #nameInput />
 * <button [cngxInputClear]="nameInput" #clr="cngxInputClear">
 *   @if (clr.hasValue()) { Clear }
 * </button>
 * ```
 *
 * @category directives
 */
@Directive({
  selector: '[cngxInputClear]',
  standalone: true,
  exportAs: 'cngxInputClear',
  host: {
    '(click)': 'clear()',
    '[attr.aria-label]': '"Clear"',
  },
})
export class CngxInputClear {
  private readonly destroyRef = inject(DestroyRef);

  /** Reference to the input or textarea element to clear. */
  readonly target = input.required<HTMLInputElement | HTMLTextAreaElement>({
    alias: 'cngxInputClear',
  });

  private readonly hasValueState = signal(false);

  /** Whether the target has a value. */
  readonly hasValue: Signal<boolean> = this.hasValueState.asReadonly();

  /** Emitted after clearing. */
  readonly cleared = output<void>();

  private initialized = false;

  /** Clears the target value, dispatches an input event, and focuses the target. */
  clear(): void {
    this.ensureListener();
    const el = this.target();
    el.value = '';
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.focus();
    this.hasValueState.set(false);
    this.cleared.emit();
  }

  /** Lazily attaches the input event listener the first time the target is interacted with. */
  private ensureListener(): void {
    if (this.initialized) {
      return;
    }
    this.initialized = true;
    const el = this.target();
    this.hasValueState.set(!!el.value);
    fromEvent(el, 'input')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.hasValueState.set(!!el.value);
      });
  }
}
