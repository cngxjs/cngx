import { computed, Directive, effect, input, inject } from '@angular/core';
import { type AbstractControl, FormGroupDirective } from '@angular/forms';

/**
 * Structural helper directive that exposes a typed FormControl from the
 * parent FormGroup by control name, removing the need for explicit casts.
 *
 * Usage: `<input [formControlName]="'email'" [cngxTypedControl]="'email'" />`
 */
@Directive({
  selector: '[cngxTypedControl]',
  standalone: true,
  exportAs: 'cngxTypedControl',
})
export class CngxTypedControl<T = unknown> {
  readonly cngxTypedControl = input.required<string>();

  private readonly formGroupDir = inject(FormGroupDirective);

  readonly control = computed<AbstractControl<T> | null>(
    () => (this.formGroupDir.form.get(this.cngxTypedControl()) as AbstractControl<T>) ?? null,
  );

  constructor() {
    effect(() => {
      const name = this.cngxTypedControl();
      if (!this.formGroupDir.form.get(name)) {
        throw new Error(
          `[cngxTypedControl] No control found with name "${name}" in the parent FormGroup.`,
        );
      }
    });
  }
}
