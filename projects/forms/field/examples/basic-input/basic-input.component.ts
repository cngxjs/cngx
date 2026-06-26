import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';

import { CngxFormField, CngxLabel, CngxHint } from '@cngx/forms/field';
import { CngxInput } from '@cngx/forms/input';

interface ProfileModel {
  fullName: string;
}

/**
 * The baseline `cngx-form-field` wiring. The component is `display: contents`
 * with zero visual footprint; it only coordinates ARIA. `CngxLabel` sets
 * `for`/`id`, `CngxInput` mirrors the field state onto the native input as
 * ARIA attributes, and `CngxHint` is linked via `aria-describedby`. Value flow
 * runs through the Signal Forms `[formField]` binding - cngx never touches the
 * value itself.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CngxFormField, CngxLabel, CngxInput, CngxHint, FormField],
  styles: `
    .demo {
      display: grid;
      gap: 6px;
      max-width: 360px;
      padding: 16px;
      font: 14px/1.4 system-ui, sans-serif;
    }
    .demo input {
      width: 100%;
      padding: 8px 10px;
      border: 1px solid #b0b0b0;
      border-radius: 4px;
      box-sizing: border-box;
      font: inherit;
    }
    .demo label {
      font-weight: 500;
    }
    .demo .readout {
      margin: 8px 0 0;
      opacity: 0.7;
    }
  `,
  template: `
    <div class="demo">
      <cngx-form-field [field]="profile.fullName">
        <label cngxLabel>Full name</label>
        <input cngxInput [formField]="profile.fullName" placeholder="Ada Lovelace" />
        <span cngxHint>As it appears on your ID</span>
      </cngx-form-field>
      <p class="readout">Value: {{ model().fullName || '—' }}</p>
    </div>
  `,
})
export class BasicInputExample {
  protected readonly model = signal<ProfileModel>({ fullName: '' });
  protected readonly profile = form(this.model);
}
