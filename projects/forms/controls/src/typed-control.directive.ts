import { computed, Directive, effect, input, inject } from '@angular/core';
import { type AbstractControl, FormGroupDirective } from '@angular/forms';

/**
 * Structural helper directive that exposes a typed FormControl from the
 * parent FormGroup by control name, removing the need for explicit casts.
 *
 * Usage: `<input [formControlName]="'email'" [cngxTypedControl]="'email'" />`
 *
 * @category directives
 */
@Directive({
  selector: '[cngxTypedControl]',
  standalone: true,
  exportAs: 'cngxTypedControl',
})
export class CngxTypedControl<T = unknown> {
  /** Name of the control to look up in the parent FormGroup. */
  readonly cngxTypedControl = input.required<string>();

  private readonly formGroupDir = inject(FormGroupDirective);

  /** The resolved `AbstractControl`, or `null` if the name is not found. */
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
