import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  form,
  schema,
  required,
  email,
  disabled,
  FormField,
  type ValidationError,
} from '@angular/forms/signals';

import {
  CngxFormField,
  CngxLabel,
  CngxFieldErrors,
  CNGX_FORM_FIELD_CONFIG,
} from '@cngx/forms/field';
import { CngxInput } from '@cngx/forms/input';

interface AccountModel {
  displayName: string;
  emailAddress: string;
  accountId: string;
}

/**
 * The three states the presenter derives from a Signal Forms field, each as a
 * pure `computed()` reflected onto a `cngx-field--*` host class and onto the
 * native input's ARIA attributes:
 *
 * - **required** - `withRequiredMarker()` (here a `CNGX_FORM_FIELD_CONFIG`
 *   override) makes `CngxLabel` append the marker for fields with a `required`
 *   validator.
 * - **error** - the gate is `invalid AND (touched OR submitted)`. The email
 *   field is pre-touched with an invalid value, so the message shows on load.
 * - **disabled** - a schema `disabled()` rule; `CngxInput` mirrors the native
 *   `disabled` attribute.
 *
 * The readout under each field renders those derived signals live - `required`,
 * `touched`, `valid`, `errors` from the field state, and `errorState` /
 * `disabled` from the `#ci="cngxInput"` directive. Nothing is synced by hand.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CngxFormField, CngxLabel, CngxInput, CngxFieldErrors, FormField],
  providers: [{ provide: CNGX_FORM_FIELD_CONFIG, useValue: { requiredMarker: '*' } }],
  styles: `
    .demo {
      display: grid;
      gap: 22px;
      max-width: 440px;
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
    .demo .cngx-field--error input {
      border-color: var(--cngx-field-error-color, #c0392b);
    }
    .demo .cngx-field--disabled input {
      opacity: 0.5;
    }
    .demo .state {
      margin: 4px 0 0;
      display: grid;
      grid-template-columns: max-content 1fr;
      gap: 3px 14px;
      font: 12px/1.5 ui-monospace, monospace;
    }
    .demo .state dt {
      margin: 0;
      opacity: 0.55;
    }
    .demo .state dd {
      margin: 0;
      font-weight: 600;
      color: #1a56c4;
    }
  `,
  template: `
    <div class="field">
      <cngx-form-field [field]="f.displayName">
        <label cngxLabel>Display name</label>
        <input cngxInput #nameCi="cngxInput" [formField]="f.displayName" />
        <cngx-field-errors />
      </cngx-form-field>
      <dl class="state">
        <dt>required</dt><dd>{{ f.displayName().required() }}</dd>
        <dt>touched</dt><dd>{{ f.displayName().touched() }}</dd>
        <dt>valid</dt><dd>{{ f.displayName().valid() }}</dd>
        <dt>errorState</dt><dd>{{ nameCi.errorState() }}</dd>
        <dt>errors</dt><dd>{{ kinds(f.displayName().errors()) }}</dd>
      </dl>
    </div>

    <div class="field">
      <cngx-form-field [field]="f.emailAddress">
        <label cngxLabel>Email</label>
        <input cngxInput #emailCi="cngxInput" [formField]="f.emailAddress" />
        <cngx-field-errors />
      </cngx-form-field>
      <dl class="state">
        <dt>required</dt><dd>{{ f.emailAddress().required() }}</dd>
        <dt>touched</dt><dd>{{ f.emailAddress().touched() }}</dd>
        <dt>valid</dt><dd>{{ f.emailAddress().valid() }}</dd>
        <dt>errorState</dt><dd>{{ emailCi.errorState() }}</dd>
        <dt>errors</dt><dd>{{ kinds(f.emailAddress().errors()) }}</dd>
      </dl>
    </div>

    <div class="field">
      <cngx-form-field [field]="f.accountId">
        <label cngxLabel>Account ID</label>
        <input cngxInput #idCi="cngxInput" [formField]="f.accountId" />
      </cngx-form-field>
      <dl class="state">
        <dt>disabled</dt><dd>{{ idCi.disabled() }}</dd>
        <dt>empty</dt><dd>{{ idCi.empty() }}</dd>
        <dt>valid</dt><dd>{{ f.accountId().valid() }}</dd>
      </dl>
    </div>
  `,
})
export class ValidationStatesExample {
  protected readonly model = signal<AccountModel>({
    displayName: '',
    emailAddress: 'not-an-email',
    accountId: 'ACC-100425',
  });

  protected readonly f = form(
    this.model,
    schema<AccountModel>((root) => {
      required(root.displayName, { message: 'Display name is required' });
      required(root.emailAddress, { message: 'Email is required' });
      email(root.emailAddress, { message: 'Enter a valid email address' });
      disabled(root.accountId);
    }),
  );

  constructor() {
    // Pre-touch so the invalid email shows its error on load.
    this.f.emailAddress().markAsTouched();
  }

  /** Joins the active error kinds for the readout, or a dash when valid. */
  protected kinds(errors: readonly ValidationError[]): string {
    return errors.length ? errors.map((e) => e.kind).join(', ') : '—';
  }
}
