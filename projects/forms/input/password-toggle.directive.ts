import { computed, Directive, ElementRef, inject, signal } from '@angular/core';

/**
 * Toggles a password input between `type="password"` and `type="text"`.
 *
 * Place on the same `<input>` element (works with or without `cngxInput`).
 * Exposes a `visible` signal and `toggle()` method for binding a toggle button.
 *
 * @example
 * ```html
 * <input cngxInput cngxPasswordToggle #pwd="cngxPasswordToggle" type="password" />
 * <button type="button" (click)="pwd.toggle()" [attr.aria-label]="pwd.visible() ? 'Hide password' : 'Show password'">
 *   {{ pwd.visible() ? 'Hide' : 'Show' }}
 * </button>
 * ```
 *
 * @category directives
 */
@Directive({
  selector: 'input[cngxPasswordToggle]',
  standalone: true,
  exportAs: 'cngxPasswordToggle',
  host: {
    '[attr.type]': 'inputType()',
    '[attr.spellcheck]': '"false"',
    '[attr.autocomplete]': 'autocomplete()',
  },
})
export class CngxPasswordToggle {
  private readonly el = inject<ElementRef<HTMLInputElement>>(ElementRef);
  private readonly visibleState = signal(false);

  /** Whether the password is currently visible (type="text"). */
  readonly visible = this.visibleState.asReadonly();

  /** @internal */
  protected readonly inputType = computed(() => (this.visibleState() ? 'text' : 'password'));

  /** @internal — autocomplete hint for new vs current password. */
  protected readonly autocomplete = computed(
    () => this.el.nativeElement.autocomplete || 'current-password',
  );

  /** Toggle password visibility. */
  toggle(): void {
    this.visibleState.update((v) => !v);
  }

  /** Show password. */
  show(): void {
    this.visibleState.set(true);
  }

  /** Hide password. */
  hide(): void {
    this.visibleState.set(false);
  }
}
