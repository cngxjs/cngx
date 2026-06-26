import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';

import { CngxFormField, CngxLabel, CngxHint } from '@cngx/forms/field';
import { CngxInput, CngxCharCount, CngxPasswordToggle } from '@cngx/forms/input';

interface ComposeModel {
  bio: string;
  password: string;
}

/**
 * Input-level atoms composing with `cngxInput` inside a `cngx-form-field`:
 *
 * - `cngx-char-count` reads the bound field value and reports length against
 *   `[max]` - no manual wiring.
 * - `cngxPasswordToggle` exposes `visible()` and `toggle()` for a consumer-owned
 *   reveal button; the directive flips the native input `type` between
 *   `password` and `text`.
 *
 * Both are behaviour-only directives; the field still owns the value via
 * `[formField]`.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CngxFormField,
    CngxLabel,
    CngxHint,
    CngxInput,
    CngxCharCount,
    CngxPasswordToggle,
    FormField,
  ],
  styles: `
    .demo {
      display: grid;
      gap: 20px;
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
    .demo input,
    .demo textarea {
      width: 100%;
      padding: 8px 10px;
      border: 1px solid #b0b0b0;
      border-radius: 4px;
      box-sizing: border-box;
      font: inherit;
    }
    .demo .count-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      opacity: 0.7;
    }
    .demo .pwd-row {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .demo .pwd-row input {
      flex: 1;
    }
    .demo button {
      padding: 6px 12px;
      border: 1px solid #888;
      border-radius: 4px;
      background: #f4f4f4;
      cursor: pointer;
      font: inherit;
    }
  `,
  template: `
    <div class="demo">
      <div class="field">
        <cngx-form-field [field]="f.bio">
          <label cngxLabel>Bio</label>
          <textarea cngxInput [formField]="f.bio" rows="3" placeholder="Tell us about yourself…"></textarea>
          <div class="count-row">
            <span cngxHint>10-140 characters</span>
            <cngx-char-count [max]="140" />
          </div>
        </cngx-form-field>
      </div>

      <div class="field">
        <cngx-form-field [field]="f.password">
          <label cngxLabel>Password</label>
          <div class="pwd-row">
            <input
              cngxInput
              cngxPasswordToggle
              #pwd="cngxPasswordToggle"
              [formField]="f.password"
              placeholder="At least 8 characters"
            />
            <button
              type="button"
              (click)="pwd.toggle()"
              [attr.aria-label]="pwd.visible() ? 'Hide password' : 'Show password'"
            >
              {{ pwd.visible() ? 'Hide' : 'Show' }}
            </button>
          </div>
          <span cngxHint>8-64 characters</span>
        </cngx-form-field>
      </div>
    </div>
  `,
})
export class InputAddonsExample {
  protected readonly model = signal<ComposeModel>({ bio: '', password: '' });
  protected readonly f = form(this.model);
}
