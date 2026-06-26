import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { form, schema, required, email, FormField } from '@angular/forms/signals';

import { CngxFormField, CngxLabel, CngxFieldErrors, CngxFormErrors } from '@cngx/forms/field';
import { CngxInput } from '@cngx/forms/input';

interface SignupModel {
  email: string;
  password: string;
}

/**
 * `cngx-form-errors` is the form-level summary (WCAG 3.3.1): on a rejected
 * submit it lists every invalid field as a focusable link, each calling
 * `focusBoundControl()` so a screen-reader user lands on the offending input.
 * It is a sibling of the `cngx-form-field` blocks, not a child - it aggregates
 * across the whole form. The summary stays hidden until `[show]` flips. Click
 * Validate to mark every field touched and reveal both the per-field errors and
 * the summary.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CngxFormField, CngxLabel, CngxInput, CngxFieldErrors, CngxFormErrors, FormField],
  styles: `
    .demo {
      display: grid;
      gap: 16px;
      max-width: 380px;
      padding: 16px;
      font: 14px/1.4 system-ui, sans-serif;
    }
    .demo .field {
      display: grid;
      gap: 6px;
    }
    .demo label {
      font-weight: 500;
    }
    .demo input {
      width: 100%;
      padding: 8px 10px;
      border: 1px solid #b0b0b0;
      border-radius: 4px;
      box-sizing: border-box;
      font: inherit;
    }
    .demo button {
      justify-self: start;
      padding: 8px 16px;
      border: 1px solid #888;
      border-radius: 4px;
      background: #f4f4f4;
      cursor: pointer;
      font: inherit;
    }
  `,
  template: `
    <div class="demo">
      <cngx-form-errors [fields]="[f.email, f.password]" [show]="showErrors()" />

      <div class="field">
        <cngx-form-field [field]="f.email">
          <label cngxLabel>Email</label>
          <input cngxInput [formField]="f.email" />
          <cngx-field-errors />
        </cngx-form-field>
      </div>

      <div class="field">
        <cngx-form-field [field]="f.password">
          <label cngxLabel>Password</label>
          <input cngxInput type="password" [formField]="f.password" />
          <cngx-field-errors />
        </cngx-form-field>
      </div>

      <button type="button" (click)="validate()">Validate</button>
    </div>
  `,
})
export class FormErrorSummaryExample {
  protected readonly model = signal<SignupModel>({ email: '', password: '' });

  protected readonly f = form(
    this.model,
    schema<SignupModel>((root) => {
      required(root.email, { message: 'Email is required' });
      email(root.email, { message: 'Enter a valid email address' });
      required(root.password, { message: 'Password is required' });
    }),
  );

  protected readonly showErrors = signal(false);

  protected validate(): void {
    this.f.email().markAsTouched();
    this.f.password().markAsTouched();
    this.showErrors.set(true);
  }
}
