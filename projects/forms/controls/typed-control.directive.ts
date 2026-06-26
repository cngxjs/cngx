import { computed, Directive, effect, input, inject } from '@angular/core';
import { type AbstractControl, FormGroupDirective } from '@angular/forms';

/**
 * Structural helper that resolves a strongly-typed `AbstractControl<T>` from the
 * enclosing `FormGroup` by name, so reactive-forms templates and host directives
 * read a control without an `as FormControl<T>` cast at every access.
 *
 * Must live inside a `[formGroup]` - it injects `FormGroupDirective` non-optionally,
 * so outside one Angular throws `NullInjectorError`. As a fail-fast guard it also
 * throws when no control matches the given name in the parent group.
 *
 * Read the resolved control through the `control` signal, via the `exportAs` ref or
 * by injecting the directive. In a template ref the generic stays `unknown`; pass
 * `T` explicitly when injecting in TypeScript to get the narrowed control.
 *

 * ```html
 * <form [formGroup]="form">
 *   <input formControlName="email" cngxTypedControl="email" #email="cngxTypedControl" />
 *   @if (email.control?.hasError('required')) {
 *     <span>Email is required</span>
 *   }
 * </form>
 * ```
 *
 * @category forms/controls
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/controls/typed-control.directive.ts
 * @since 0.1.0
 * @relatedTo CngxFormBridge, CngxBindField
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
