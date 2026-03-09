import { Directive, Input, type OnInit, inject } from '@angular/core';
import { type AbstractControl, FormGroupDirective } from '@angular/forms';

/**
 * Structural helper directive that exposes a typed FormControl from the
 * parent FormGroup by control name, removing the need for explicit casts.
 *
 * Usage: `<input [formControlName]="'email'" ngxTypedControl="email" />`
 */
@Directive({
  selector: '[cngxTypedControl]',
  standalone: true,
  exportAs: 'cngxTypedControl',
})
export class CngxTypedControl<T = unknown> implements OnInit {
  @Input({ required: true }) cngxTypedControl!: string;

  private readonly formGroupDir = inject(FormGroupDirective);

  get control(): AbstractControl<T> | null {
    return this.formGroupDir.form.get(this.cngxTypedControl) as AbstractControl<T> | null;
  }

  ngOnInit(): void {
    if (!this.control) {
      throw new Error(
        `[cngxTypedControl] No control found with name "${this.cngxTypedControl}" in the parent FormGroup.`,
      );
    }
  }
}
