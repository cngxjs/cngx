import { Directive, Input, OnInit, inject } from '@angular/core';
import { FormGroupDirective } from '@angular/forms';

/**
 * Structural helper directive that exposes a typed FormControl from the
 * parent FormGroup by control name, removing the need for explicit casts.
 *
 * Usage: `<input [formControlName]="'email'" ngxTypedControl="email" />`
 */
@Directive({
  selector: '[ngxTypedControl]',
  standalone: true,
  exportAs: 'ngxTypedControl',
})
export class TypedControlDirective<T = unknown> implements OnInit {
  @Input({ required: true }) ngxTypedControl!: string;

  private readonly formGroupDir = inject(FormGroupDirective);

  get control() {
    return this.formGroupDir.form.get(this.ngxTypedControl);
  }

  ngOnInit(): void {
    if (!this.control) {
      throw new Error(
        `[ngxTypedControl] No control found with name "${this.ngxTypedControl}" in the parent FormGroup.`,
      );
    }
  }
}
